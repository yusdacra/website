import Konva from 'konva';
import 'konva/skia-backend';
import { writeFile, readFile, stat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '$env/dynamic/private';
// const env = Deno.env.toObject();
import type { Canvas } from 'skia-canvas';
import sharp from 'sharp';
import random from 'random';
import { createNoise3D } from 'simplex-noise';
import { dev } from '$app/environment';

const DATA_DIR = join(env.WEBSITE_DATA_DIR ?? '', 'constellation');
const GRAPH_FILE = join(DATA_DIR, 'graph_processed.json');
const OUTPUT_FILE = join(DATA_DIR, 'background.svg');
const DUST_FILE = join(DATA_DIR, 'background_dust.webp');
const OG_IMAGE_FILE = join(DATA_DIR, 'og_image.png');
const STARS_FILE = join(DATA_DIR, 'stars.json');
const GRAPH_URL = 'https://eightyeightthirty.one/graph.json';

type GraphData = {
	linksTo: Record<string, string[]>;
};

type Star = {
	domain: string;
	x: number;
	y: number;
	z: number;
	connections: string[];
	visualConnections: string[];
};

export type Nebula = { x: number; y: number; z: number; density: number };
export type Dust = {
	x: number;
	y: number;
	z: number;
	alpha: number;
	sizeFactor: number;
	color: string;
};

export type ConstellationData = {
	stars: Star[];
	nebulae: Nebula[];
	dust: Dust[];
	seed: number;
};



export const generateConstellationData = (
	data: GraphData,
	seed: number = 567238047896
): ConstellationData => {
	const rng = random.clone(seed);

	// seeded prng for noise (mulberry32)
	const mulberry32 = (a: number) => () => {
		let t = (a += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const noise3D = createNoise3D(mulberry32(seed));
	const NOISE_SCALE = 0.0012; // controls feature size of cosmic structures

	// sample density at a point (returns 0-1, higher = denser cosmic region)
	const cosmicDensity = (p: { x: number; y: number; z: number }): number => {
		const n1 = noise3D(p.x * NOISE_SCALE, p.y * NOISE_SCALE, p.z * NOISE_SCALE);
		const n2 = noise3D(p.x * NOISE_SCALE * 2, p.y * NOISE_SCALE * 2, p.z * NOISE_SCALE * 2) * 0.5;
		const combined = (n1 + n2) / 1.5;
		return (combined + 1) / 2; // normalize to 0-1
	};

	const SPHERE_RADIUS = 1800;
	const MAX_STARS = 750; // Target total stars

	// --- Vector Math Helpers ---
	type Vec3 = { x: number; y: number; z: number };

	const vecAdd = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
	const vecSub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
	const vecScale = (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s });
	const vecLen = (v: Vec3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
	const vecNorm = (v: Vec3): Vec3 => {
		const l = vecLen(v);
		return l === 0 ? { x: 0, y: 0, z: 0 } : vecScale(v, 1 / l);
	};
	const vecDot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
	const vecCross = (a: Vec3, b: Vec3): Vec3 => ({
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	});
	const vecDistSq = (a: Vec3, b: Vec3): number => {
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		const dz = a.z - b.z;
		return dx * dx + dy * dy + dz * dz;
	};

	// geodesic (great-circle) arc distance on sphere surface
	const geodesicDist = (a: Vec3, b: Vec3): number => {
		const dotProduct = vecDot(a, b) / (SPHERE_RADIUS * SPHERE_RADIUS);
		const clamped = Math.max(-1, Math.min(1, dotProduct));
		return SPHERE_RADIUS * Math.acos(clamped);
	};

	// Rotate vector v around axis k by angle theta
	const vecRotate = (v: Vec3, k: Vec3, theta: number): Vec3 => {
		const cos = Math.cos(theta);
		const sin = Math.sin(theta);
		const cross = vecCross(k, v);
		const dot = vecDot(k, v);
		return vecAdd(
			vecAdd(vecScale(v, cos), vecScale(cross, sin)),
			vecScale(k, dot * (1 - cos))
		);
	};

	// --- Geometric Shape Generation ---

	interface ShapeNode {
		id: number;
		pos: Vec3;
		adj: number[]; // Connected node IDs within this shape
	}

	interface ConstellationShape {
		id: number;
		nodes: ShapeNode[];
		aabb2d: { minX: number; minY: number; maxX: number; maxY: number };
	}

	const STEP_SIZE_MIN = 80;
	const STEP_SIZE_MAX = 140;
	const MIN_NODE_DIST = STEP_SIZE_MIN * 0.7; // Minimum distance between stars
	const CONSTELLATION_PADDING = STEP_SIZE_MAX; // Extra padding for AABB checks

	const shapes: ConstellationShape[] = [];
	let shapeIdCounter = 0;

	// Ratios for constellation sizes
	const SIZE_RATIOS: Record<number, number> = {
		3: 0.05, 4: 0.10, 5: 0.20, 6: 0.25, 7: 0.20, 8: 0.15, 9: 0.05
	};

	// Shape modes control how constellations grow
	type ShapeMode = 'linear' | 'zigzag' | 'looped' | 'branching';
	const SHAPE_MODE_RATIOS: Record<ShapeMode, number> = {
		linear: 0.10,    // mostly straight lines
		zigzag: 0.35,    // sharp direction changes
		looped: 0.35,    // intentionally curls back on itself
		branching: 0.20  // has multiple offshoots
	};

	// Create a pool of target sizes and modes to pick from
	const pendingShapes: { size: number; mode: ShapeMode }[] = [];
	{
		let sizeSum = 0;
		for (const r of Object.values(SIZE_RATIOS)) sizeSum += r;
		const tempTotal = MAX_STARS / 6;

		const modeKeys = Object.keys(SHAPE_MODE_RATIOS) as ShapeMode[];
		let modeSum = 0;
		for (const r of Object.values(SHAPE_MODE_RATIOS)) modeSum += r;

		for (const [sizeStr, sizeRatio] of Object.entries(SIZE_RATIOS)) {
			const size = parseInt(sizeStr);
			const count = Math.round(tempTotal * (sizeRatio / sizeSum));
			for (let k = 0; k < count; k++) {
				// pick shape mode based on ratios
				const roll = rng.float(0, modeSum);
				let cumulative = 0;
				let mode: ShapeMode = 'linear';
				for (const m of modeKeys) {
					cumulative += SHAPE_MODE_RATIOS[m];
					if (roll < cumulative) {
						mode = m;
						break;
					}
				}
				pendingShapes.push({ size, mode });
			}
		}
		// Shuffle
		for (let i = pendingShapes.length - 1; i > 0; i--) {
			const j = Math.floor(rng.float(0, 1) * (i + 1));
			[pendingShapes[i], pendingShapes[j]] = [pendingShapes[j], pendingShapes[i]];
		}
	}

	const updateAABB = (shape: ConstellationShape) => {
		if (shape.nodes.length === 0) return;
		let minX = Infinity, minY = Infinity;
		let maxX = -Infinity, maxY = -Infinity;
		for (const n of shape.nodes) {
			minX = Math.min(minX, n.pos.x);
			minY = Math.min(minY, n.pos.y);
			maxX = Math.max(maxX, n.pos.x);
			maxY = Math.max(maxY, n.pos.y);
		}
		shape.aabb2d = {
			minX: minX - CONSTELLATION_PADDING,
			minY: minY - CONSTELLATION_PADDING,
			maxX: maxX + CONSTELLATION_PADDING,
			maxY: maxY + CONSTELLATION_PADDING
		};
	};

	const dist2D = (a: Vec3, b: Vec3): number => {
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	const checkCollision = (p: Vec3, ignoreShapeId: number = -1): boolean => {
		for (const shape of shapes) {
			if (shape.id === ignoreShapeId) continue;
			if (p.x < shape.aabb2d.minX || p.x > shape.aabb2d.maxX ||
				p.y < shape.aabb2d.minY || p.y > shape.aabb2d.maxY) {
				continue;
			}
			for (const node of shape.nodes) {
				if (dist2D(p, node.pos) < MIN_NODE_DIST) return true;
			}
		}
		return false;
	};

	const checkSelfCollision = (p: Vec3, shape: ConstellationShape): boolean => {
		for (const node of shape.nodes) {
			if (dist2D(p, node.pos) < MIN_NODE_DIST) return true;
		}
		return false;
	};

	type ShapeMeta = { mode: ShapeMode; snapped: boolean; curled: boolean };
	const shapeMetas: Map<number, ShapeMeta> = new Map();

	// --- 1. Generate Shapes ---
	while (pendingShapes.length > 0) {
		const { size: targetSize, mode: shapeMode } = pendingShapes.pop()!;
		const shape: ConstellationShape = {
			id: shapeIdCounter++,
			nodes: [],
			aabb2d: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
		};

		// mode-specific parameters (angles in radians)
		const modeConfig = {
			linear: { minAngle: 0, angleRange: Math.PI / 3, branchChance: 0.05, curlBackChance: 0.0, snapThreshold: 0.7 },
			zigzag: { minAngle: Math.PI / 4, angleRange: (2 * Math.PI) / 3, branchChance: 0.10, curlBackChance: 0.0, snapThreshold: 0.6 },
			looped: { minAngle: 0, angleRange: Math.PI / 2, branchChance: 0.05, curlBackChance: 0.50, snapThreshold: 0.3 },
			branching: { minAngle: 0, angleRange: Math.PI / 2, branchChance: 0.40, curlBackChance: 0.0, snapThreshold: 0.6 }
		}[shapeMode];

		// start point - use noise-weighted candidate selection
		let startPos: Vec3 = { x: 0, y: 0, z: 0 };
		let placedStart = false;

		// generate candidate positions and score them by cosmic density
		const NUM_CANDIDATES = 15;
		const candidates: { pos: Vec3; density: number }[] = [];

		for (let c = 0; c < NUM_CANDIDATES; c++) {
			const u = rng.float(0, 1);
			const v = rng.float(0, 1);
			const theta = 2 * Math.PI * u;
			const phi = Math.acos(2 * v - 1);
			const pos: Vec3 = {
				x: SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
				y: SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta),
				z: SPHERE_RADIUS * Math.cos(phi)
			};

			if (!checkCollision(pos)) {
				let density = cosmicDensity(pos);

				// Anti-clustering: Repulsion from same-mode shapes
				let repulsion = 0;
				const REPULSION_RADIUS = 700;
				const REPULSION_WEIGHT = 1.2;

				for (const [id, meta] of shapeMetas) {
					if (meta.mode === shapeMode) {
						const otherShape = shapes.find(s => s.id === id);
						if (otherShape && otherShape.nodes.length > 0) {
							const distSq = vecDistSq(pos, otherShape.nodes[0].pos);
							repulsion += Math.exp(-distSq / (REPULSION_RADIUS * REPULSION_RADIUS));
						}
					}
				}

				// Apply penalty, keeping a small positive minimum to allow placement if necessary
				density = Math.max(0.001, density - repulsion * REPULSION_WEIGHT);

				candidates.push({ pos, density });
			}
		}

		if (candidates.length > 0) {
			// pick from top candidates weighted by density
			candidates.sort((a, b) => b.density - a.density);
			const topN = Math.min(5, candidates.length);
			const topCandidates = candidates.slice(0, topN);

			// weighted random selection among top candidates
			const totalDensity = topCandidates.reduce((sum, c) => sum + c.density, 0);
			let roll = rng.float(0, totalDensity);
			let chosen = topCandidates[0];
			for (const c of topCandidates) {
				roll -= c.density;
				if (roll <= 0) {
					chosen = c;
					break;
				}
			}
			startPos = chosen.pos;
			placedStart = true;
		}

		if (!placedStart) continue;

		shape.nodes.push({ id: 0, pos: startPos, adj: [] });
		updateAABB(shape);

		let failedGrowth = false;
		let prevDir: Vec3 | null = null;
		let activeTipId = 0;
		let prevStepDist = 0;
		let prevAngleSign = 0;

		for (let i = 1; i < targetSize; i++) {
			let placed = false;
			let parentId = activeTipId;
			let isBranching = false;

			const starsLeft = targetSize - i;
			const canBranch = starsLeft >= 2;
			const progress = i / targetSize;

			// determine if we should branch based on mode
			if (canBranch && rng.float(0, 1) < modeConfig.branchChance) {
				isBranching = true;
			}

			const tipNode = shape.nodes.find(n => n.id === activeTipId)!;
			if (tipNode.adj.length >= 2 && rng.float(0, 1) < 0.7) {
				isBranching = true;
			}

			if (isBranching) {
				const candidates = shape.nodes.filter(n => n.adj.length < 3);
				if (candidates.length === 0) {
					failedGrowth = true;
					break;
				}
				const p = candidates[Math.floor(rng.float(0, candidates.length))];
				parentId = p.id;
			}

			let parent = shape.nodes.find(n => n.id === parentId);
			if (!parent || parent.adj.length >= 3) {
				const candidates = shape.nodes.filter(n => n.adj.length < 3);
				if (candidates.length === 0) {
					failedGrowth = true;
					break;
				}
				parent = candidates[Math.floor(rng.float(0, candidates.length))];
				parentId = parent.id;
			}

			const normal = vecNorm(parent.pos);
			let tangent = vecCross(normal, { x: 0, y: 1, z: 0 });
			if (vecLen(tangent) < 0.01) tangent = vecCross(normal, { x: 1, y: 0, z: 0 });
			tangent = vecNorm(tangent);

			let baseDir = tangent;
			if (parentId === activeTipId && i > 1 && prevDir && !isBranching) {
				baseDir = vecNorm(prevDir);
			}

			let snapped = false;
			let didCurl = false;

			// curl-back: try to move toward an existing node (for looped mode)
			let curlTarget: Vec3 | null = null;
			if (modeConfig.curlBackChance > 0 && rng.float(0, 1) < modeConfig.curlBackChance && shape.nodes.length >= 3) {
				// find a node that's not the parent and not adjacent to parent
				const curlCandidates = shape.nodes.filter(n =>
					n.id !== parentId &&
					!parent!.adj.includes(n.id) &&
					n.adj.length < 3
				);
				if (curlCandidates.length > 0) {
					const target = curlCandidates[Math.floor(rng.float(0, curlCandidates.length))];
					curlTarget = target.pos;
				}
			}

			for (let tryIdx = 0; tryIdx < 25; tryIdx++) {
				let newDir: Vec3;

				if (curlTarget && tryIdx < 10) {
					// more tries moving toward curl target
					const toTarget = vecSub(curlTarget, parent.pos);
					const projected = vecSub(toTarget, vecScale(normal, vecDot(toTarget, normal)));
					if (vecLen(projected) > 0.01) {
						const jitter = (rng.float(0, 1) - 0.5) * (Math.PI / 6);
						newDir = vecRotate(vecNorm(projected), normal, jitter);
					} else {
						newDir = vecRotate(tangent, normal, rng.float(0, 2 * Math.PI));
					}
				} else if (!isBranching && parentId === activeTipId && prevDir) {
					// mode-specific angle deviation with minimum enforced
					// bias toward alternating direction to avoid straight lines
					let sign: number;
					if (prevAngleSign !== 0 && rng.float(0, 1) < 0.7) {
						sign = -prevAngleSign; // 70% chance to flip direction
					} else {
						sign = rng.float(0, 1) < 0.5 ? -1 : 1;
					}
					const angleMagnitude = modeConfig.minAngle + rng.float(0, 1) * (modeConfig.angleRange - modeConfig.minAngle);
					const angle = sign * angleMagnitude;
					newDir = vecRotate(baseDir, normal, angle);
					prevAngleSign = sign;
				} else {
					const angle = rng.float(0, 2 * Math.PI);
					newDir = vecRotate(tangent, normal, angle);
				}

				// enforce variation in step distance (at least 20% different from previous)
				const distRange = STEP_SIZE_MAX - STEP_SIZE_MIN;
				const minVariation = distRange * 0.2;
				let dist: number;
				if (prevStepDist > 0) {
					// pick from either low or high side, avoiding previous value
					const lowMax = Math.max(STEP_SIZE_MIN, prevStepDist - minVariation);
					const highMin = Math.min(STEP_SIZE_MAX, prevStepDist + minVariation);
					if (rng.float(0, 1) < 0.5 && lowMax > STEP_SIZE_MIN) {
						dist = rng.float(STEP_SIZE_MIN, lowMax);
					} else if (highMin < STEP_SIZE_MAX) {
						dist = rng.float(highMin, STEP_SIZE_MAX);
					} else {
						dist = rng.float(STEP_SIZE_MIN, STEP_SIZE_MAX);
					}
				} else {
					dist = rng.float(STEP_SIZE_MIN, STEP_SIZE_MAX);
				}
				prevStepDist = dist;

				let nextPos = vecAdd(parent.pos, vecScale(newDir, dist));
				nextPos = vecScale(vecNorm(nextPos), SPHERE_RADIUS);

				// expanded snapping: trigger based on mode threshold instead of just last 2 stars
				if (progress >= modeConfig.snapThreshold) {
					// 1. try snapping to edge midpoints (splits edge)
					for (const u of shape.nodes) {
						if (snapped) break;
						for (const vId of u.adj) {
							if (vId < u.id) continue;
							const v = shape.nodes.find(n => n.id === vId)!;
							if (u.id === parent!.id || v.id === parent!.id) continue;

							const mid = vecScale(vecAdd(u.pos, v.pos), 0.5);
							const snapDist = dist * (shapeMode === 'looped' ? 0.6 : 0.4);
							if (vecDistSq(nextPos, mid) < snapDist ** 2) {
								nextPos = vecScale(vecNorm(mid), SPHERE_RADIUS);

								u.adj = u.adj.filter(x => x !== v.id);
								v.adj = v.adj.filter(x => x !== u.id);

								if (checkCollision(nextPos, shape.id) || checkSelfCollision(nextPos, shape)) {
									u.adj.push(v.id);
									v.adj.push(u.id);
									continue;
								}

								const newNode: ShapeNode = { id: i, pos: nextPos, adj: [u.id, v.id] };
								shape.nodes.push(newNode);
								u.adj.push(i);
								v.adj.push(i);

								snapped = true;
								placed = true;
								activeTipId = i;
								break;
							}
						}
					}

					// 2. try snapping directly to existing nodes (creates a loop)
					if (!snapped && shapeMode === 'looped') {
						const nodeSnapDist = dist * 1.5;
						for (const candidate of shape.nodes) {
							if (candidate.id === parent!.id) continue;
							if (parent!.adj.includes(candidate.id)) continue;
							if (candidate.adj.length >= 3) continue;

							if (vecDistSq(nextPos, candidate.pos) < nodeSnapDist ** 2) {
								if (checkCollision(nextPos, shape.id) || checkSelfCollision(nextPos, shape)) continue;

								const newNode: ShapeNode = { id: i, pos: nextPos, adj: [parent!.id, candidate.id] };
								shape.nodes.push(newNode);
								parent!.adj.push(i);
								candidate.adj.push(i);
								snapped = true;
								placed = true;
								activeTipId = i;
								break;
							}
						}
					}
				}

				if (snapped) break;

				if (!checkCollision(nextPos, shape.id) && !checkSelfCollision(nextPos, shape)) {
					const newNode: ShapeNode = { id: i, pos: nextPos, adj: [parent.id] };
					shape.nodes.push(newNode);
					parent.adj.push(i);
					prevDir = vecSub(nextPos, parent.pos);
					placed = true;
					updateAABB(shape);
					activeTipId = i;
					break;
				}
			}

			if (!placed && !snapped) {
				failedGrowth = true;
				break;
			}
		}

		if (!failedGrowth) {
			// post-processing: connect parallel branches for branching mode
			if (shapeMode === 'branching' && shape.nodes.length >= 4) {
				// find leaf nodes (degree 1)
				const leaves = shape.nodes.filter(n => n.adj.length === 1);
				const MAX_LADDER_DIST = STEP_SIZE_MAX * 1.8;

				// helper: get ancestors up to N hops
				const getAncestors = (nodeId: number, maxHops: number): number[] => {
					const ancestors: number[] = [];
					let current = nodeId;
					for (let h = 0; h < maxHops; h++) {
						const node = shape.nodes.find(n => n.id === current);
						if (!node || node.adj.length === 0) break;
						const parent = node.adj[0];
						ancestors.push(parent);
						current = parent;
					}
					return ancestors;
				};

				// helper: check if any ancestor of A is adjacent to any ancestor of B
				const ancestorsConnected = (ancestorsA: number[], ancestorsB: number[]): boolean => {
					for (const aId of ancestorsA) {
						const aNode = shape.nodes.find(n => n.id === aId);
						if (!aNode) continue;
						for (const bId of ancestorsB) {
							if (aNode.adj.includes(bId)) return true;
						}
					}
					return false;
				};

				for (let li = 0; li < leaves.length; li++) {
					const leafA = leaves[li];
					if (leafA.adj.length >= 2) continue;

					const ancestorsA = getAncestors(leafA.id, 2);

					for (let lj = li + 1; lj < leaves.length; lj++) {
						const leafB = leaves[lj];
						if (leafB.adj.length >= 2) continue;

						const parentBId = leafB.adj[0];
						if (ancestorsA[0] === parentBId) continue; // same parent, not parallel

						const ancestorsB = getAncestors(leafB.id, 2);

						const distSq = vecDistSq(leafA.pos, leafB.pos);
						if (distSq > MAX_LADDER_DIST ** 2) continue;

						if (leafA.adj.length >= 3 || leafB.adj.length >= 3) continue;

						// connect if ancestors (within 2 hops) are adjacent
						if (ancestorsConnected(ancestorsA, ancestorsB)) {
							leafA.adj.push(leafB.id);
							leafB.adj.push(leafA.id);
							break;
						}
					}
				}
			}

			// --- Post-process: Remove crossing edges ---
			// project positions to 2D for intersection tests (using x,y)
			const proj2D = (p: Vec3): { x: number; y: number } => ({ x: p.x, y: p.y });

			const segmentsIntersect = (
				a1: { x: number; y: number }, a2: { x: number; y: number },
				b1: { x: number; y: number }, b2: { x: number; y: number }
			): boolean => {
				const ccw = (A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }) =>
					(C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
				return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
			};

			type Edge = { u: number; v: number; lenSq: number };
			const edges: Edge[] = [];
			for (const node of shape.nodes) {
				for (const adjId of node.adj) {
					if (adjId > node.id) {
						const other = shape.nodes.find(n => n.id === adjId)!;
						edges.push({ u: node.id, v: adjId, lenSq: vecDistSq(node.pos, other.pos) });
					}
				}
			}

			const edgesToRemove = new Set<string>();
			for (let i = 0; i < edges.length; i++) {
				for (let j = i + 1; j < edges.length; j++) {
					const e1 = edges[i];
					const e2 = edges[j];

					// skip if they share a vertex
					if (e1.u === e2.u || e1.u === e2.v || e1.v === e2.u || e1.v === e2.v) continue;

					const n1u = shape.nodes.find(n => n.id === e1.u)!;
					const n1v = shape.nodes.find(n => n.id === e1.v)!;
					const n2u = shape.nodes.find(n => n.id === e2.u)!;
					const n2v = shape.nodes.find(n => n.id === e2.v)!;

					if (segmentsIntersect(proj2D(n1u.pos), proj2D(n1v.pos), proj2D(n2u.pos), proj2D(n2v.pos))) {
						// remove the longer edge
						const key1 = `${Math.min(e1.u, e1.v)}-${Math.max(e1.u, e1.v)}`;
						const key2 = `${Math.min(e2.u, e2.v)}-${Math.max(e2.u, e2.v)}`;
						if (e1.lenSq > e2.lenSq) {
							edgesToRemove.add(key1);
						} else {
							edgesToRemove.add(key2);
						}
					}
				}
			}

			// apply removals
			for (const key of edgesToRemove) {
				const [uStr, vStr] = key.split('-');
				const u = parseInt(uStr);
				const v = parseInt(vStr);
				const nodeU = shape.nodes.find(n => n.id === u);
				const nodeV = shape.nodes.find(n => n.id === v);
				if (nodeU) nodeU.adj = nodeU.adj.filter(x => x !== v);
				if (nodeV) nodeV.adj = nodeV.adj.filter(x => x !== u);
			}

			shapes.push(shape);
			shapeMetas.set(shape.id, { mode: shapeMode, snapped: false, curled: false });
		} else {
			if (rng.float(0, 1) > 0.5) pendingShapes.push({ size: targetSize, mode: shapeMode });
		}
	}

	// --- 2. Map Domains to Shapes (DFS) ---

	const allDomains = Object.keys(data.linksTo);
	const validDomains = new Set(allDomains);
	// Shuffle domains for randomness
	for (let i = allDomains.length - 1; i > 0; i--) {
		const j = Math.floor(rng.float(0, 1) * (i + 1));
		[allDomains[i], allDomains[j]] = [allDomains[j], allDomains[i]];
	}

	const usedDomains = new Set<string>();
	const finalStars: Star[] = [];

	// Prepare limited roots
	const getLimitRatio = (domain: string): number | null => {
		if (domain.includes('forum')) return 0;
		const BANNED = ['proboards.com', 'boards.net', 'jcink.net', 'jcink.com', 'bbactif.com', 'superforo.net'];
		if (BANNED.includes(domain)) return 0;
		const LIMITED = ['neocities.org', 'wordpress.com', 'blogspot.com', 'blogfree.net'];
		if (LIMITED.includes(domain)) return 0.025; // 2.5%
		return null;
	};
	const getRootDomain = (domain: string): string => {
		const parts = domain.split('.');
		if (parts.length > 2) {
			const root = parts.slice(-2).join('.');
			if (getLimitRatio(root) !== null) return root;
		}
		return domain;
	};
	const rootCounts = new Map<string, number>();

	let domainCursor = 0;

	const stats = {
		totalShapes: 0,
		truncated: 0,
		perfect: 0,
		oneStar: 0,
		sizeDistribution: {} as Record<number, number>,
		modeDistribution: { linear: 0, zigzag: 0, looped: 0, branching: 0 } as Record<ShapeMode, number>
	};

	// --- Helper: Shape Analysis ---
	const analyzeShapeRequirements = (shape: ConstellationShape, startNodeId: number) => {
		// BFS to build layers from startNode
		const layers: number[][] = [];
		const visited = new Set<number>([startNodeId]);
		const parentMap = new Map<number, number>();

		let currentLayer = [startNodeId];
		while (currentLayer.length > 0) {
			layers.push(currentLayer);
			const nextLayer: number[] = [];
			for (const u of currentLayer) {
				const node = shape.nodes.find(n => n.id === u)!;
				for (const v of node.adj) {
					if (!visited.has(v)) {
						visited.add(v);
						parentMap.set(v, u);
						nextLayer.push(v);
					}
				}
			}
			currentLayer = nextLayer;
		}

		// Bottom-up to calculate subtree requirements
		const requiredSubtreeSize = new Map<number, number>(); // inclusive of self
		for (let i = layers.length - 1; i >= 0; i--) {
			for (const u of layers[i]) {
				let size = 1;
				// Sum children
				const node = shape.nodes.find(n => n.id === u)!;
				for (const v of node.adj) {
					if (parentMap.get(v) === u) {
						size += requiredSubtreeSize.get(v) || 0;
					}
				}
				requiredSubtreeSize.set(u, size);
			}
		}
		return { requiredSubtreeSize, parentMap };
	};

	// --- Global Optimization Strategy ---

	// 1. Sort shapes by difficulty (biggest first)
	shapes.sort((a, b) => b.nodes.length - a.nodes.length);

	// 2. Pre-calculate potentials for ALL domains to create a high-quality pool
	console.log('analyzing domain potentials...');
	const domainPool: { domain: string; potential: number }[] = [];

	// We use a simplified potential check here (just degree or shallow BFS) for speed
	// Actually, let's just use connection count as a rough heuristic first, 
	// or perform the actual BFS if it's fast enough. 
	// For ~1000 domains BFS depth 10 is fast.

	const getDomainPotential = (startDomain: string, limit: number): number => {
		let count = 0;
		const q = [startDomain];
		const visitedLocal = new Set<string>([startDomain]);
		let head = 0;
		while (head < q.length && count < limit) {
			const u = q[head++];
			count++;
			const links = data.linksTo[u] || [];
			for (const v of links) {
				if (!validDomains.has(v) || visitedLocal.has(v)) continue;
				// Check static limits (ban list)
				const r = getRootDomain(v);
				if (getLimitRatio(r) === 0) continue;

				visitedLocal.add(v);
				q.push(v);
			}
		}
		return count;
	};

	for (const d of allDomains) {
		// Filter banned roots immediately
		const r = getRootDomain(d);
		if (getLimitRatio(r) === 0) continue;

		const p = getDomainPotential(d, 20); // Check up to size 20
		domainPool.push({ domain: d, potential: p });
	}

	// Sort pool: highest potential first
	domainPool.sort((a, b) => b.potential - a.potential);
	console.log(`analyzed ${domainPool.length} domains for potential pool.`);

	// --- 3. Strict Match Loop ---

	for (const shape of shapes) {
		stats.totalShapes++;

		let startNode = shape.nodes.find(n => n.adj.length === 1);
		if (!startNode) startNode = shape.nodes[0];

		const neededTotal = shape.nodes.length;
		const { requiredSubtreeSize } = analyzeShapeRequirements(shape, startNode.id);

		// Try to find a PERFECT match in the pool
		let bestMapping: Map<number, string> | null = null;
		let bestRoot: string | null = null;

		// To avoid O(N*M) where N=shapes, M=domains, we iterate the sorted pool.
		// Since we want the "best" available, we start from top.

		for (let i = 0; i < domainPool.length; i++) {
			const candidate = domainPool[i];
			if (usedDomains.has(candidate.domain)) continue;
			if (candidate.potential < neededTotal * 0.8) continue;

			const r = getRootDomain(candidate.domain);
			const ratio = getLimitRatio(r);
			if (ratio !== null) {
				const c = rootCounts.get(r) || 0;
				if (c >= MAX_STARS * ratio) continue;
			}

			const tempMapping = new Map<number, string>();
			tempMapping.set(startNode.id, candidate.domain);
			const tempUsed = new Set<string>(usedDomains); // localized used set
			tempUsed.add(candidate.domain);

			const stack = [{ shapeNodeId: startNode.id, domain: candidate.domain }];
			const visitedShapeNodes = new Set<number>([startNode.id]);
			let success = true;

			while (stack.length > 0) {
				const { shapeNodeId, domain } = stack.pop()!;
				const shapeNode = shape.nodes.find(n => n.id === shapeNodeId)!;
				const shapeNeighbors = shapeNode.adj.filter(nid => !visitedShapeNodes.has(nid));

				if (shapeNeighbors.length === 0) continue;

				// Connections
				let links = (data.linksTo[domain] || [])
					.filter(d => validDomains.has(d) && !tempUsed.has(d));

				// Heuristic Sort: Match biggest subtree needs to biggest potential neighbors
				const neighborsWithNeeds = shapeNeighbors.map(nid => ({
					nid,
					needed: requiredSubtreeSize.get(nid) || 1
				})).sort((a, b) => b.needed - a.needed);

				// Get potentials of links
				const linkPotentials = links.map(d => ({
					d,
					p: (data.linksTo[d] || []).length // Fast degree check
				})).sort((a, b) => b.p - a.p);

				if (linkPotentials.length < neighborsWithNeeds.length) {
					success = false;
					break; // Truncated
				}

				// Assign
				for (let j = 0; j < neighborsWithNeeds.length; j++) {
					const targetNode = neighborsWithNeeds[j];
					const link = linkPotentials[j];

					// Limit Check
					const lr = getRootDomain(link.d);
					const lratio = getLimitRatio(lr);
					if (lratio === 0) { success = false; break; } // Should match initial filter
					if (lratio !== null) {
						// Here we can't easily track temp increments without a map.
						// Let's assume for a single shape it won't blow the budget unless budget is tight.
						const c = (rootCounts.get(lr) || 0); // + local usage in this shape?
						// Let's ignore local usage for limit check for simplicity, it's rare to use same root massive times in one shape
						if (c >= MAX_STARS * lratio) { success = false; break; }
					}

					tempMapping.set(targetNode.nid, link.d);
					tempUsed.add(link.d);
					visitedShapeNodes.add(targetNode.nid);
					stack.push({ shapeNodeId: targetNode.nid, domain: link.d });
				}
				if (!success) break;
			}

			if (success && tempMapping.size === neededTotal) {
				// Perfect match found!
				bestMapping = tempMapping;
				bestRoot = candidate.domain;
				break; // Stop searching pool
			}
		}

		if (bestMapping) {
			const meta = shapeMetas.get(shape.id);
			if (meta) stats.modeDistribution[meta.mode]++;
			stats.perfect++;
			stats.sizeDistribution[bestMapping.size] = (stats.sizeDistribution[bestMapping.size] || 0) + 1;

			for (const [nid, dom] of bestMapping) {
				usedDomains.add(dom);
				const r = getRootDomain(dom);
				if (getLimitRatio(r) !== null) rootCounts.set(r, (rootCounts.get(r) || 0) + 1);

				// Add star
				const node = shape.nodes.find(n => n.id === nid)!;
				const neighbors = node.adj.map(aid => bestMapping!.get(aid)).filter(x => x !== undefined) as string[];

				finalStars.push({
					domain: dom,
					x: node.pos.x,
					y: node.pos.y,
					z: node.pos.z,
					connections: data.linksTo[dom] || [],
					visualConnections: neighbors
				});
			}
		} else {
			stats.truncated++; // Discarded entire shape
			// console.log(`Could not find perfect match for shape size ${neededTotal}`);
		}
	}

	console.log('--- Constellation Generation Stats ---');
	console.log(`Truncated: ${stats.truncated} (${stats.totalShapes ? ((stats.truncated / stats.totalShapes) * 100).toFixed(1) : 0}%)`);
	console.log(`Perfect (Full Shape): ${stats.perfect} (${stats.totalShapes ? ((stats.perfect / stats.totalShapes) * 100).toFixed(1) : 0}%)`);
	console.log(`Single Star Constellations: ${stats.oneStar}`);
	console.log(`Size Distribution:`, JSON.stringify(stats.sizeDistribution));
	console.log(`Mode Distribution:`, JSON.stringify(stats.modeDistribution));
	console.log('--------------------------------------');

	const stars = finalStars;
	console.log(`Final stars generated: ${stars.length}`);

	// 5. Generate ebulae (Density-based)
	const PROBE_COUNT = 300;
	const SEARCH_RADIUS = 400;
	const DENSITY_THRESHOLD = 4;
	type NebulaDef = { x: number; y: number; z: number; density: number };
	let candidates: NebulaDef[] = [];

	for (let i = 0; i < PROBE_COUNT; i++) {
		if (stars.length === 0) break;
		const p = stars[Math.floor(rng.float(0, 1) * stars.length)];

		let neighbors = 0;
		let sumX = 0,
			sumY = 0,
			sumZ = 0;

		for (const s of stars) {
			const dx = s.x - p.x;
			const dy = s.y - p.y;
			const dz = s.z - p.z;
			const d2 = dx * dx + dy * dy + dz * dz;
			if (d2 < SEARCH_RADIUS * SEARCH_RADIUS) {
				neighbors++;
				sumX += s.x;
				sumY += s.y;
				sumZ += s.z;
			}
		}

		if (neighbors >= DENSITY_THRESHOLD)
			candidates.push({
				x: sumX / neighbors,
				y: sumY / neighbors,
				z: sumZ / neighbors,
				density: neighbors
			});
	}

	const nebulae: Nebula[] = [];
	const MERGE_DIST = 400;
	candidates.sort((a, b) => b.density - a.density);

	console.log(`found ${candidates.length} density-based nebula candidates.`);

	const breakDensity = candidates.length > 0 ? candidates[Math.floor(candidates.length * 0.7)]?.density ?? 0 : 0;
	console.log(`70th percentile density: ${breakDensity}`);

	for (const c of candidates) {
		let merged = false;
		for (const n of nebulae) {
			const dist = Math.sqrt((c.x - n.x) ** 2 + (c.y - n.y) ** 2 + (c.z - n.z) ** 2);
			if (dist < MERGE_DIST) {
				n.density = Math.max(n.density, c.density);
				merged = true;
				break;
			}
		}
		if (!merged) nebulae.push(c);

		if (c.density < breakDensity) break;
	}
	console.log(`generated ${nebulae.length} density-based nebulae.`);

	// 6. Generate Dust (Void Noise)
	const dust: Dust[] = [];
	const DUST_COUNT = 50000;
	console.log('generating void noise...');

	for (let i = 0; i < DUST_COUNT; i++) {
		const u = rng.float(0, 1);
		const v = rng.float(0, 1);
		const theta = 2 * Math.PI * u;
		const phi = Math.acos(2 * v - 1);
		const r = SPHERE_RADIUS * Math.cbrt(rng.float(0, 1));

		const dx = r * Math.sin(phi) * Math.cos(theta);
		const dy = r * Math.sin(phi) * Math.sin(theta);
		const dz = r * Math.cos(phi);

		const baseAlpha = 0.15 + rng.float(0, 1) * 0.2;

		dust.push({
			x: dx,
			y: dy,
			z: dz,
			alpha: baseAlpha,
			sizeFactor: 0.5 + rng.float(0, 1) * 1.5,
			color: rng.float(0, 1) > 0.5 ? '#FFFFFF' : '#AAAAAA'
		});
	}
	console.log(`generated ${dust.length} dust particles.`);

	return { stars, nebulae, dust, seed };
};

export const initConstellation = async () => {
	try {
		try {
			await stat(DATA_DIR);
		} catch {
			await mkdir(DATA_DIR, { recursive: true });
		}

		sharp.concurrency(1);

		let start = Date.now();
		console.log('fetching 88x31s graph data...');
		const response = await fetch(GRAPH_URL);
		const data: GraphData = await response.json();
		console.log(`fetched 88x31s graph data in ${Date.now() - start}ms`);

		start = Date.now();
		console.log('generating constellation data...');
		// Use fixed seed in dev, random in prod
		const seed = dev ? 567238047896 : Date.now();
		const { stars, nebulae, dust } = generateConstellationData(data, seed);

		await writeFile(GRAPH_FILE, JSON.stringify({ stars, nebulae, dust, seed }));
		console.log(
			`${stars.length} stars, ${nebulae.length} nebulae, ${dust.length} dust particles generated in ${Date.now() - start}ms`
		);

		await renderConstellation();
	} catch (error) {
		console.error('error initializing constellation:', error);
	}
};

type ProjectedTrans = { x: number; y: number; scale: number; z: number };

export const renderConstellation = async () => {
	try {
		try {
			await stat(GRAPH_FILE);
		} catch {
			await initConstellation();
			return;
		}

		const start = Date.now();
		console.log('rendering constellation to SVG...');

		const constellationData: ConstellationData = JSON.parse(await readFile(GRAPH_FILE, 'utf-8'));
		const { stars, nebulae, dust, seed } = constellationData;
		const rng = random.clone(seed);

		const RESOLUTION_SCALE = 1;
		const width = 1920 * RESOLUTION_SCALE;
		const height = 1080 * RESOLUTION_SCALE;

		const fov = 400 * RESOLUTION_SCALE; // Field of view equivalent
		const cx = width / 2;
		const cy = height / 2;

		// Calculate angle based on time: one full rotation per 3 hours (Y-axis)
		const periodY = 3 * 60 * 60 * 1000;
		// Secondary rotation on X-axis to see the poles (different period to avoid repeating patterns)
		const periodX = 5.14 * 60 * 60 * 1000;

		const date = Date.now();
		const angleY = ((date % periodY) / periodY) * Math.PI * 2;
		const angleX = ((date % periodX) / periodX) * Math.PI * 2;

		const cosY = Math.cos(angleY);
		const sinY = Math.sin(angleY);
		const cosX = Math.cos(angleX);
		const sinX = Math.sin(angleX);

		const rotatePoint = (x: number, y: number, z: number) => {
			// Yaw (Y-axis)
			const x1 = x * cosY - z * sinY;
			const z1 = z * cosY + x * sinY;
			const y1 = y;

			// Pitch (X-axis)
			const y2 = y1 * cosX - z1 * sinX;
			const z2 = z1 * cosX + y1 * sinX;
			const x2 = x1;

			return { x: x2, y: y2, z: z2 };
		};

		let svgBody = '';
		let defsContent = `
			<style>
				/* <![CDATA[ */
				@keyframes twinkle {
					0% { opacity: 1; }
					5% { opacity: 0.3; }
					10% { opacity: 1; }
					100% { opacity: 1; }
				}
				@keyframes flicker {
					0% { opacity: 1; }
					2% { opacity: 1; }
					4% { opacity: 0.4; }
					6% { opacity: 1; }
					8% { opacity: 0.4; }
					10% { opacity: 1; }
					12% { opacity: 0.8; }
					14% { opacity: 1; }
					100% { opacity: 1; }
				}
				.anim-twinkle { animation: twinkle linear infinite; transform-box: fill-box; transform-origin: center; }
				.anim-flicker { animation: flicker linear infinite; transform-box: fill-box; transform-origin: center; }
				/* ]]> */
			</style>
		`;

		const stage = new Konva.Stage({
			width,
			height
		});
		const layer = new Konva.Layer();
		stage.add(layer);

		const rect = new Konva.Rect({
			width,
			height,
			fill: '#000000'
		});
		layer.add(rect);

		// Draw dust particles using Konva
		for (const d of dust) {
			const { x: rotX, y: rotY, z: rotZ } = rotatePoint(d.x, d.y, d.z);

			if (rotZ > 100) {
				const scale = fov / rotZ;
				const screenX = cx + rotX * scale;
				const screenY = cy + rotY * scale * -1;

				const size = d.sizeFactor * scale;

				const rect = new Konva.Rect({
					x: screenX,
					y: screenY,
					width: size,
					height: size,
					fill: d.color,
					opacity: d.alpha
				});
				layer.add(rect);
			}
		}

		layer.draw();

		const sharpImg = await (stage.toCanvas() as unknown as Canvas).toSharp();
		const buffer = await sharpImg.webp({ effort: 6, quality: 30, smartDeblock: true }).toBuffer();
		await writeFile(DUST_FILE, buffer);
		sharpImg.destroy();

		stage.destroyChildren();
		stage.destroy();

		const projected: Record<string, ProjectedTrans> = {};

		const fmt = (n: number) => n.toFixed(1); // round to 1 decimal place, so we save more space

		// 0. Universe Noise / Heatmap (Background Nebulae)
		let nebulaIndex = 0;
		for (const n of nebulae) {
			// Rotate matches star rotation
			const { x: rotX, y: rotY, z: rotZ } = rotatePoint(n.x, n.y, n.z);

			// Render if in front of camera
			if (rotZ > 100) {
				const scale = fov / rotZ;
				const screenX = cx + rotX * scale;
				const screenY = cy + rotY * scale * -1;

				// Density -> Size & Opacity
				const intensity = Math.min(1, n.density / 25);

				const hueSeed = Math.abs(Math.sin(n.x * n.y * n.z));
				const hue = 200 + hueSeed * 80;

				const radius = (600 + intensity * 800) * scale;
				const alpha = 0.2 + intensity * 0.5;

				const gradId = `nebula-${nebulaIndex++}`;
				defsContent += `
                <radialGradient id="${gradId}" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                    <stop offset="0%" stop-color="hsla(${fmt(hue)}, 90%, 60%, ${fmt(alpha)})" />
                    <stop offset="100%" stop-color="hsla(0, 0%, 0%, 0)" />
                </radialGradient>`;

				svgBody += `<circle cx="${fmt(screenX)}" cy="${fmt(screenY)}" r="${fmt(radius)}" fill="url(#${gradId})" opacity="1" />`;
			}
		}

		// 1. Projection pass
		for (const star of stars) {
			const { x: rotX, y: rotY, z: rotZ } = rotatePoint(star.x, star.y, star.z);

			if (rotZ > 10) {
				const scale = fov / rotZ;
				const screenX = cx + rotX * scale;
				const screenY = cy + rotY * scale * -1;

				projected[star.domain] = { x: screenX, y: screenY, scale, z: rotZ };
			}
		}

		// 2. Draw connections
		const drawnConnections = new Set<string>();

		type RenderLine = {
			p1: { x: number; y: number; z: number };
			p2: { x: number; y: number; z: number };
			avgZ: number;
		};

		const linesToDraw: RenderLine[] = [];

		for (const star of stars) {
			if (!projected[star.domain]) continue;

			const p1 = projected[star.domain];

			if (star.visualConnections) {
				for (const target of star.visualConnections) {
					const key = [star.domain, target].sort().join('-');
					if (drawnConnections.has(key)) continue;
					drawnConnections.add(key);

					if (projected[target]) {
						const p2 = projected[target];
						const avgZ = (p1.z + p2.z) / 2;
						linesToDraw.push({ p1, p2, avgZ });
					}
				}
			}
		}

		linesToDraw.sort((a, b) => b.avgZ - a.avgZ);

		for (const line of linesToDraw) {
			const { p1, p2, avgZ } = line;

			const opacity = Math.max(0.4, Math.min(1, 1 - avgZ / 3000));
			const strokeWidth = Math.max(0.2 * RESOLUTION_SCALE, 1.5 * RESOLUTION_SCALE * (1000 / avgZ));

			// Halo (black line behind)
			// svgBody += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#000000" stroke-width="${strokeWidth + strokeWidth * opacity}" opacity="1" stroke-linecap="butt" />`;

			// Actual Line
			svgBody += `<line x1="${fmt(p1.x)}" y1="${fmt(p1.y)}" x2="${fmt(p2.x)}" y2="${fmt(p2.y)}" stroke="#FFFFFF" stroke-width="${fmt(strokeWidth)}" opacity="${fmt(opacity)}" stroke-linecap="butt" />`;
		}

		// for interactivity (we put links on these screen coordinates)
		const visibleStars: { domain: string; x: number; y: number; r: number }[] = [];
		// 3. Draw Stars
		for (const star of stars) {
			if (!projected[star.domain]) continue;
			const p = projected[star.domain];

			const connectionCount = star.connections ? star.connections.length : 0;
			// importance = Math.min(1.5, 1 + connectionCount * 0.1);
			// Max 1.8, add randomness so high-link constellations aren't uniformly huge
			let baseImportance = 0.6 + connectionCount * 0.15;

			// random variation +/- 20%
			const sizeNoise = rng.float(0.8, 1.2);
			baseImportance *= sizeNoise;

			const importance = Math.min(1.8, Math.max(0.6, baseImportance));

			const radius = Math.max(1 * RESOLUTION_SCALE, 25 * p.scale * importance) * 0.4;
			const haloRadius = radius * 1.85;

			const strokeWidth = haloRadius - radius;

			const opacity = Math.min(1, Math.max(0.2, 1000 / p.z));
			const haloOpacity = opacity * 0.3;

			// Animation logic
			const animType = rng.float(0, 1);
			let animClass = '';
			let duration = 0;

			if (animType > 0.85) {
				animClass = 'anim-flicker';
				duration = rng.float(3.0, 7.0);
			} else if (animType > 0.4) {
				animClass = 'anim-twinkle';
				duration = rng.float(3.0, 6.0);
			}

			const delay = rng.float(0, 10);
			const style = animClass ? `style="animation-duration: ${fmt(duration)}s; animation-delay: -${fmt(delay)}s"` : '';
			const cls = animClass ? `class="${animClass}"` : '';

			svgBody += `<rect ${cls} ${style} x="${fmt(p.x - radius / 2)}" y="${fmt(p.y - radius / 2)}" width="${fmt(radius)}" height="${fmt(radius)}" fill="#EEEEEE" fill-opacity="${fmt(opacity)}" stroke="#FFFFFF" stroke-opacity="${fmt(haloOpacity)}" stroke-width="${fmt(strokeWidth)}" paint-order="stroke fill" />`;

			visibleStars.push({ domain: star.domain, x: p.x, y: p.y, r: radius * 1.75 });
		}

		const finalSvg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>${defsContent}</defs>
        ${svgBody}
        </svg>`;

		await writeFile(OUTPUT_FILE, finalSvg);

		await writeFile(
			STARS_FILE,
			JSON.stringify({
				width,
				height,
				stars: visibleStars,
				meta: {
					timestamp: new Date().toISOString(),
					angleY,
					angleX,
					seed: constellationData.seed
				}
			})
		);

		console.log('generating OG image...');
		(async () => {
			const og_start = Date.now();
			const h = 630;
			const s = sharp(OUTPUT_FILE).resize({ height: h })
			const resized_svg = await s.toBuffer();
			const og = sharp(DUST_FILE)
				.resize({ height: h })
				.composite([{ input: resized_svg }])
				.png();
			await og.toFile(OG_IMAGE_FILE);
			console.log(`generated OG image in ${Date.now() - og_start}ms`);
			s.destroy();
			og.destroy();
		})();

		console.log(`rendered constellation in ${Date.now() - start}ms`);
	} catch (error) {
		console.error('error rendering constellation:', error);
	}
};
