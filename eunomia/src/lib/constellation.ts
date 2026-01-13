import Konva from 'konva';
import 'konva/skia-backend';
import { writeFile, readFile, stat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '$env/dynamic/private';
import type { Canvas } from 'skia-canvas';

const DATA_DIR = join(env.WEBSITE_DATA_DIR, 'constellation');
const GRAPH_FILE = join(DATA_DIR, 'graph_processed.json');
const OUTPUT_FILE = join(DATA_DIR, 'background.svg');
const DUST_FILE = join(DATA_DIR, 'background_dust.webp');
const STARS_FILE = join(DATA_DIR, 'stars.json');
const GRAPH_URL = 'https://eightyeightthirty.one/graph.json';

type GraphData = {
    linksTo: Record<string, string[]>;
}

type Star = {
    domain: string;
    x: number;
    y: number;
    z: number;
    connections: string[];
    visualConnections: string[];
}

export type Nebula = { x: number, y: number, z: number, density: number };
export type Dust = { x: number, y: number, z: number, alpha: number, sizeFactor: number, color: string };

export type ConstellationData = {
    stars: Star[];
    nebulae: Nebula[];
    dust: Dust[];
};

// Deterministic implementation with SeededRNG
class SeededRNG {
    private seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }
}

export const generateConstellationData = (data: GraphData, seed: number = 123456): ConstellationData => {
    const rng = new SeededRNG(seed);

    // Configuration
    const MAX_STARS = 2000;
    const CLUSTER_SIZE_MAX = 8;
    const MIN_DIST = 140;
    const STEP_SIZE = 150;
    const ATTEMPTS = 32;

    // Limits
    const ROOT_DOMAIN_LIMIT_RATIO = 0.025; // 2.5% of MAX_STARS
    const TOTAL_ROOT_DOMAIN_LIMIT_RATIO = 0.2; // 20% of MAX_STARS
    const MAX_PER_ROOT = Math.floor(MAX_STARS * ROOT_DOMAIN_LIMIT_RATIO);
    const MAX_TOTAL_ROOT = Math.floor(MAX_STARS * TOTAL_ROOT_DOMAIN_LIMIT_RATIO);
    const SPECIAL_ROOTS = new Set(['neocities.org', 'wordpress.com', 'blogspot.com', 'blogfree.net', 'forumfree.it', 'forumcommunity.net', 'proboards.com', 'boards.net', 'jcink.net', 'forumactif.net', 'forumactif.org', 'forumactif.com', 'freeforums.net']);

    const getRootDomain = (domain: string): string => {
        const parts = domain.split('.');
        if (parts.length > 2) {
            const root = parts.slice(-2).join('.');
            if (SPECIAL_ROOTS.has(root)) return root;
        }
        return domain; // Default to full domain if not special
    };

    const rootDomainCounts = new Map<string, number>();

    // 1. Filter and Collect Stars
    const allDomains = Object.keys(data.linksTo);
    const validDomains = new Set<string>(allDomains);

    // 2. Greedy Clustering
    const stars: Star[] = [];
    const visited = new Set<string>();
    const clusters: { center: { x: number, y: number, z: number }, stars: Star[] }[] = [];

    // Shuffle domains deterministically
    for (let i = allDomains.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [allDomains[i], allDomains[j]] = [allDomains[j], allDomains[i]];
    }

    for (const domain of allDomains) {
        if (visited.has(domain)) continue;
        if (stars.length >= MAX_STARS) break;

        const root = getRootDomain(domain);
        const currentCount = rootDomainCounts.get(root) || 0;

        // Only limit if it is one of the special roots
        if (SPECIAL_ROOTS.has(root) && currentCount >= MAX_PER_ROOT) continue;

        // or if the total number of special roots exceeds the limit
        const totalSpecialCount = rootDomainCounts.entries().filter(([root]) => SPECIAL_ROOTS.has(root)).reduce((a, [, b]) => a + b, 0);
        if (totalSpecialCount >= MAX_TOTAL_ROOT) continue;

        // Start a new cluster
        const clusterStars: Star[] = [];
        const stack: string[] = [domain];

        // We do NOT add to visited yet, we do it when we actually push to clusterStars

        const skeletonEdges: [string, string][] = [];
        const parents = new Map<string, string>();

        // Fill cluster (greedy DFS)
        while (stack.length > 0 && clusterStars.length < CLUSTER_SIZE_MAX) {
            const current = stack.pop()!;

            if (visited.has(current)) continue;

            const currentRoot = getRootDomain(current);
            const count = rootDomainCounts.get(currentRoot) || 0;
            if (SPECIAL_ROOTS.has(currentRoot) && count >= MAX_PER_ROOT) continue;

            visited.add(current);
            rootDomainCounts.set(currentRoot, count + 1);

            const links = data.linksTo[current] || [];

            clusterStars.push({
                domain: current,
                x: 0, y: 0, z: 0,
                connections: links,
                visualConnections: []
            });

            const parent = parents.get(current);
            if (parent) skeletonEdges.push([parent, current]);

            const neighbors: string[] = [];
            for (const link of links) {
                if (!visited.has(link) && validDomains.has(link)) {
                    neighbors.push(link);
                    // Do not mark visited here, wait until we pop
                    parents.set(link, current);
                }
            }

            // Randomize neighbors for DFS
            for (let i = neighbors.length - 1; i > 0; i--) {
                const j = Math.floor(rng.next() * (i + 1));
                [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
            }
            stack.push(...neighbors);
        }

        if (clusterStars.length > 0) {
            clusters.push({ center: { x: 0, y: 0, z: 0 }, stars: clusterStars });

            // Map stars for quick lookup
            const clusterMap = new Map<string, Star>();
            clusterStars.forEach(s => clusterMap.set(s.domain, s));

            // Build dual-linked visual connections
            skeletonEdges.forEach(([src, dst]) => {
                const s1 = clusterMap.get(src);
                const s2 = clusterMap.get(dst);
                if (s1 && s2) {
                    s1.visualConnections.push(dst);
                    s2.visualConnections.push(src);
                }
            });

            stars.push(...clusterStars);
        }
    }

    // 3. Layout Clusters on Fibonacci Sphere
    const phi = Math.PI * (3 - Math.sqrt(5));
    const sphereRadius = 1800;

    for (let i = 0; i < clusters.length; i++) {
        const y = 1 - (i / (clusters.length - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;

        clusters[i].center = {
            x: Math.cos(theta) * radiusAtY * sphereRadius,
            y: y * sphereRadius,
            z: Math.sin(theta) * radiusAtY * sphereRadius
        };
    }

    // 4. Layout Stars (Directional Bias with Global Collision)
    const placedStars: Star[] = [];

    // Helper: Rotate vector v around random axis by angle
    const rotateVector = (v: { dx: number, dy: number, dz: number }, angle: number) => {
        // Random axis perpendicular to v
        const rx = rng.next() - 0.5;
        const ry = rng.next() - 0.5;
        const rz = rng.next() - 0.5;

        // Cross product v x r
        let cpx = v.dy * rz - v.dz * ry;
        let cpy = v.dz * rx - v.dx * rz;
        let cpz = v.dx * ry - v.dy * rx;

        let cpLen = Math.sqrt(cpx * cpx + cpy * cpy + cpz * cpz);
        if (cpLen < 0.001) { cpx = 1; cpy = 0; cpz = 0; cpLen = 1; }

        // Axis k (normalized)
        const kx = cpx / cpLen;
        const ky = cpy / cpLen;
        const kz = cpz / cpLen;

        // Rodrigues rotation: v_rot = v * cos(a) + (k x v) * sin(a)
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // k x v
        const kxv_x = ky * v.dz - kz * v.dy;
        const kxv_y = kz * v.dx - kx * v.dz;
        const kxv_z = kx * v.dy - ky * v.dx;

        const newDx = v.dx * cos + kxv_x * sin;
        const newDy = v.dy * cos + kxv_y * sin;
        const newDz = v.dz * cos + kxv_z * sin;

        const len = Math.sqrt(newDx * newDx + newDy * newDy + newDz * newDz);
        return { dx: newDx / len, dy: newDy / len, dz: newDz / len };
    };

    // Helper: Check collision
    const checkCollision = (x: number, y: number, z: number) => {
        const minDistSq = MIN_DIST * MIN_DIST;
        for (const s of placedStars) {
            const d2 = (s.x - x) ** 2 + (s.y - y) ** 2 + (s.z - z) ** 2;
            if (d2 < minDistSq) return true;
        }
        return false;
    };

    for (const cluster of clusters) {
        if (cluster.stars.length === 0) continue;

        // Root star
        const first = cluster.stars[0];
        first.x = cluster.center.x;
        first.y = cluster.center.y;
        first.z = cluster.center.z;

        placedStars.push(first);
        const placedInCluster = new Set<string>([first.domain]);

        // Initial random direction
        const u = rng.next();
        const v = rng.next();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);

        const directions = new Map<string, { dx: number, dy: number, dz: number }>();
        directions.set(first.domain, {
            dx: Math.sin(phi) * Math.cos(theta),
            dy: Math.sin(phi) * Math.sin(theta),
            dz: Math.cos(phi)
        });

        const layoutQueue = [first];

        while (layoutQueue.length > 0) {
            const current = layoutQueue.shift()!;
            const prevDir = directions.get(current.domain)!;

            const unplacedNeighbors = current.visualConnections
                .map(id => cluster.stars.find(s => s.domain === id))
                .filter(s => s && !placedInCluster.has(s.domain)) as Star[];

            for (const target of unplacedNeighbors) {
                let bestPos = { x: 0, y: 0, z: 0 };
                let bestDir = prevDir;
                let placed = false;

                // Try multiple directions
                for (let i = 0; i < ATTEMPTS; i++) {
                    const angle = (30 + rng.next() * 60) * (Math.PI / 180);
                    const newDir = rotateVector(prevDir, angle);

                    const cx = current.x + newDir.dx * STEP_SIZE;
                    const cy = current.y + newDir.dy * STEP_SIZE;
                    const cz = current.z + newDir.dz * STEP_SIZE;

                    if (!checkCollision(cx, cy, cz)) {
                        bestPos = { x: cx, y: cy, z: cz };
                        bestDir = newDir;
                        placed = true;
                        break;
                    }
                }

                // Fallback: Force straight line
                if (!placed) {
                    bestPos = {
                        x: current.x + prevDir.dx * STEP_SIZE,
                        y: current.y + prevDir.dy * STEP_SIZE,
                        z: current.z + prevDir.dz * STEP_SIZE
                    };
                    bestDir = prevDir;
                }

                target.x = bestPos.x;
                target.y = bestPos.y;
                target.z = bestPos.z;

                placedInCluster.add(target.domain);
                placedStars.push(target);
                directions.set(target.domain, bestDir);
                layoutQueue.push(target);
            }
        }

        // Handle isolated/leftover stars 
        for (const star of cluster.stars) {
            if (!placedInCluster.has(star.domain)) {
                // Try random spots near center
                for (let k = 0; k < 10; k++) {
                    const cx = cluster.center.x + (rng.next() - 0.5) * 200;
                    const cy = cluster.center.y + (rng.next() - 0.5) * 200;
                    const cz = cluster.center.z + (rng.next() - 0.5) * 200;

                    if (!checkCollision(cx, cy, cz) || k === 9) {
                        star.x = cx; star.y = cy; star.z = cz;
                        break;
                    }
                }
                placedInCluster.add(star.domain);
                placedStars.push(star);
            }
        }
    }

    // 5. Generate Nebulae (Density-based)
    const PROBE_COUNT = 300;
    const SEARCH_RADIUS = 400;
    const DENSITY_THRESHOLD = 4;
    type NebulaDef = { x: number, y: number, z: number, density: number };
    let candidates: NebulaDef[] = [];

    for (let i = 0; i < PROBE_COUNT; i++) {
        if (stars.length === 0) break;
        const p = stars[Math.floor(rng.next() * stars.length)];

        let neighbors = 0;
        let sumX = 0, sumY = 0, sumZ = 0;

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

    const breakDensity = candidates[Math.floor(candidates.length * 0.7)].density;
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
        const u = rng.next();
        const v = rng.next();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = sphereRadius * Math.cbrt(rng.next());

        const dx = r * Math.sin(phi) * Math.cos(theta);
        const dy = r * Math.sin(phi) * Math.sin(theta);
        const dz = r * Math.cos(phi);

        const baseAlpha = 0.15 + rng.next() * 0.3;

        dust.push({
            x: dx,
            y: dy,
            z: dz,
            alpha: baseAlpha,
            sizeFactor: (0.5 + rng.next() * 1.5),
            color: rng.next() > 0.5 ? '#FFFFFF' : '#AAAAAA'
        });
    }
    console.log(`generated ${dust.length} dust particles.`);

    return { stars, nebulae, dust };
}

export const initConstellation = async () => {
    try {
        try {
            await stat(DATA_DIR);
        } catch {
            await mkdir(DATA_DIR, { recursive: true });
        }

        let start = Date.now();
        console.log('fetching 88x31s graph data...');
        const response = await fetch(GRAPH_URL);
        const data: GraphData = await response.json();
        console.log(`fetched 88x31s graph data in ${Date.now() - start}ms`);

        start = Date.now();
        console.log('generating constellation data...');
        const { stars, nebulae, dust } = generateConstellationData(data);

        await writeFile(GRAPH_FILE, JSON.stringify({ stars, nebulae, dust }));
        console.log(`${stars.length} stars, ${nebulae.length} nebulae, ${dust.length} dust particles generated in ${Date.now() - start}ms`);

        await renderConstellation();
    } catch (error) {
        console.error('error initializing constellation:', error);
    }
}

type ProjectedTrans = { x: number, y: number, scale: number, z: number };

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
        const { stars, nebulae, dust } = constellationData;

        const RESOLUTION_SCALE = 1;
        const width = 1920 * RESOLUTION_SCALE;
        const height = 1080 * RESOLUTION_SCALE;

        const fov = 400 * RESOLUTION_SCALE; // Field of view equivalent
        const cx = width / 2;
        const cy = height / 2;

        // Calculate angle based on time: one full rotation per 3 hours (Y-axis)
        const periodY = 3 * 60 * 60 * 1000;
        // Secondary rotation on X-axis to see the poles (slightly different period to avoid repeating patterns)
        const periodX = 5.14 * 60 * 60 * 1000;

        const date = Date.now();
        const angleY = ((date % periodY) / periodY) * Math.PI * 2;
        const angleX = ((date % periodX) / periodX) * Math.PI * 2;

        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);

        // Helper: Apply 3D rotation (Y then X)
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

        // Initialize SVG content
        let svgBody = '';
        let defsContent = '';

        // 0.5 Render Dust via Konva
        // Use a Stage/Layer for dust only, transparent background
        const stage = new Konva.Stage({
            width,
            height,
        });
        const layer = new Konva.Layer();
        stage.add(layer);

        const rect = new Konva.Rect({
            width,
            height,
            fill: '#000000',
        });
        layer.add(rect);

        // Draw dust particles using Konva
        for (const d of dust) {
            const { x: rotX, y: rotY, z: rotZ } = rotatePoint(d.x, d.y, d.z);

            if (rotZ > 100) {
                const scale = fov / rotZ;
                const screenX = cx + rotX * scale;
                const screenY = cy + (rotY * scale * -1);

                const size = d.sizeFactor * scale;

                const rect = new Konva.Rect({
                    x: screenX,
                    y: screenY,
                    width: size,
                    height: size,
                    fill: d.color,
                    opacity: d.alpha,
                });
                layer.add(rect);
            }
        }

        layer.draw();

        const sharpImg = await (stage.toCanvas() as unknown as Canvas).toSharp();
        const buffer = await sharpImg.webp({ effort: 6, quality: 30, smartDeblock: true }).toBuffer();
        await writeFile(DUST_FILE, buffer);

        const projected: Record<string, ProjectedTrans> = {};

        const fmt = (n: number) => n.toFixed(2); // Round to 2 decimal places

        // 0. Universe Noise / Heatmap (Background Nebulae)
        let nebulaIndex = 0;
        for (const n of nebulae) {
            // Rotate matches star rotation
            const { x: rotX, y: rotY, z: rotZ } = rotatePoint(n.x, n.y, n.z);

            // Render if in front of camera
            if (rotZ > 100) {
                const scale = fov / rotZ;
                const screenX = cx + rotX * scale;
                const screenY = cy + (rotY * scale * -1);

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
                const screenY = cy + (rotY * scale * -1);

                projected[star.domain] = { x: screenX, y: screenY, scale, z: rotZ };
            }
        }

        // 2. Draw connections
        const drawnConnections = new Set<string>();

        type RenderLine = {
            p1: { x: number, y: number, z: number };
            p2: { x: number, y: number, z: number };
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

            const opacity = Math.max(0.4, Math.min(1, 1 - (avgZ / 3000)));
            const strokeWidth = Math.max(0.2 * RESOLUTION_SCALE, 1.5 * RESOLUTION_SCALE * (1000 / avgZ));

            // Halo (black line behind)
            // svgBody += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#000000" stroke-width="${strokeWidth + strokeWidth * opacity}" opacity="1" stroke-linecap="butt" />`;

            // Actual Line
            svgBody += `<line x1="${fmt(p1.x)}" y1="${fmt(p1.y)}" x2="${fmt(p2.x)}" y2="${fmt(p2.y)}" stroke="#FFFFFF" stroke-width="${fmt(strokeWidth)}" opacity="${fmt(opacity)}" stroke-linecap="butt" />`;
        }

        // 3. Draw Stars
        for (const star of stars) {
            if (!projected[star.domain]) continue;
            const p = projected[star.domain];

            const connectionCount = star.connections ? star.connections.length : 0;
            const importance = Math.min(1.5, 1 + connectionCount * 0.1);

            const radius = Math.max(1 * RESOLUTION_SCALE, 25 * p.scale * importance) * 0.4;
            const haloRadius = radius * 1.85;

            const strokeWidth = haloRadius - radius;

            const opacity = Math.min(1, Math.max(0.2, 1000 / p.z));
            const haloOpacity = opacity * 0.3;

            svgBody += `<rect x="${fmt(p.x - radius / 2)}" y="${fmt(p.y - radius / 2)}" width="${fmt(radius)}" height="${fmt(radius)}" fill="#EEEEEE" fill-opacity="${fmt(opacity)}" stroke="#FFFFFF" stroke-opacity="${fmt(haloOpacity)}" stroke-width="${fmt(strokeWidth)}" paint-order="stroke fill" />`;
        }

        // Construct final SVG
        const finalSvg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>${defsContent}</defs>
        ${svgBody}
        </svg>`;

        await writeFile(OUTPUT_FILE, finalSvg);

        // Export projected coordinates for frontend interactivity
        const visibleStars = stars
            .filter(star => projected[star.domain])
            .map(star => {
                const p = projected[star.domain];
                const connectionCount = star.connections ? star.connections.length : 0;
                const importance = Math.min(1.5, 1 + connectionCount * 0.1);
                return {
                    domain: star.domain,
                    x: p.x,
                    y: p.y,
                    r: Math.max(1 * RESOLUTION_SCALE, 25 * p.scale * importance) * 0.7
                };
            });

        await writeFile(STARS_FILE, JSON.stringify({
            width,
            height,
            stars: visibleStars,
            meta: {
                timestamp: new Date().toISOString(),
                angleY,
                angleX
            }
        }));

        console.log(`rendered constellation in ${Date.now() - start}ms`);
    } catch (error) {
        console.error('error rendering constellation:', error);
    }
}
