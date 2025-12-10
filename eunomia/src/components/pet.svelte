<script module lang="ts">
	import { get, writable } from 'svelte/store';

	export const localDistanceTravelled = writable(0.0);
	export const localBounces = writable(0);
</script>

<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import { browser } from '$app/environment';

	interface Props {
		apiToken: string;
	}

	let { apiToken }: Props = $props();

	let lastDragged = 0;
	let mouseX = 0;
	let mouseY = 0;

	let position = $state({ x: 0, y: 0 });
	let rotation = $state(0.0);
	let sprite = $state('/pet/idle.webp');
	let flip = $state(false);
	let dragged = $state(false);

	let targetX = 120;
	let speed = 10.0;
	let tickRate = 20;
	let delta = 1.0 / tickRate;

	let strideRadius = 4.0;
	let strideAngle = 0;

	const turnStrideWheel = (by: number) => {
		strideAngle += by / strideRadius;
		if (strideAngle > Math.PI * 2) {
			strideAngle -= Math.PI * 2;
		} else if (strideAngle < 0) {
			strideAngle += Math.PI * 2;
		}
	};

	let targetRotation = 0.0;
	let rotationVelocity = 0.0;
	let springStiffness = 20.0; // How quickly rotation returns to target
	let springDamping = 0.2; // Damping factor to prevent oscillation

	const updateRotationSpring = () => {
		// Spring physics: calculate force based on distance from target
		const springForce = (targetRotation - rotation) * springStiffness;

		// Apply damping to velocity
		rotationVelocity = rotationVelocity * (1 - springDamping) + springForce * delta;

		// Update rotation based on velocity
		rotation += rotationVelocity * delta;

		// If we're very close to target and barely moving, just snap to target
		if (Math.abs(rotation - targetRotation) < 0.01 && Math.abs(rotationVelocity) < 0.01) {
			rotation = targetRotation;
			rotationVelocity = 0;
		}
	};

	// Add spring update to the move function
	if (browser) setInterval(updateRotationSpring, tickRate);

	const moveTowards = (from: number, to: number, by: number) => {
		let d = (to - from) * 1.0;
		let l = Math.abs(d);
		let s = Math.sign(d);
		let moveBy = s * Math.min(l, by) * delta;
		return moveBy;
	};

	// Physics constants
	let velocityX = 0;
	let velocityY = 0;
	let gravity = 200.0; // Gravity strength (positive because -Y is up)
	let friction = 0.96; // Air friction
	let groundFriction = 0.9; // Ground friction
	let bounciness = 0.8; // How much energy is preserved on bounce

	const sendBounceMetrics = () => {
		fetch(`/_api/pet/bounce?_token=${apiToken}`);
		localBounces.set(get(localBounces) + 1);
	};

	let deltaTravelled = 0.0;
	let deltaTravelledTotal = 0.0;
	const updateDistanceTravelled = () => {
		if (deltaTravelled > 0.1 || deltaTravelled < -0.1) {
			localDistanceTravelled.update((n) => {
				n += deltaTravelled;
				return n;
			});
			deltaTravelledTotal += deltaTravelled;
		}
		deltaTravelled = 0.0;
	};

	const sendTotalDistance = () => {
		fetch(`/_api/pet/distance?_token=${apiToken}`, {
			method: 'POST',
			body: deltaTravelledTotal.toString()
		});
		deltaTravelledTotal = 0.0;
	};

	// sending every 5 seconds is probably reliable enough
	if (browser) setInterval(sendTotalDistance, 1000 * 5);

	const move = () => {
		if (dragged) return;

		// Apply physics when pet is in motion
		if (velocityX !== 0 || velocityY !== 0 || position.y !== 0) {
			// Apply gravity (remember negative Y is upward)
			velocityY += gravity * delta;

			// Apply friction
			const fric = position.y === 0 ? groundFriction : friction;
			velocityX *= fric;
			velocityY *= fric;

			// Update position
			const moveX = velocityX * delta;
			const moveY = velocityY * delta;
			position.x += moveX;
			position.y += moveY;

			deltaTravelled += Math.sqrt(moveX ** 2 + moveY ** 2);
			updateDistanceTravelled();

			// Handle window boundaries
			const viewportWidth = window.innerWidth;

			// Bounce off sides
			if (position.x < 0) {
				position.x = 0;
				velocityX = -velocityX * bounciness;
				sendBounceMetrics();
			} else if (position.x > viewportWidth) {
				position.x = viewportWidth;
				velocityX = -velocityX * bounciness;
				sendBounceMetrics();
			}

			// Bounce off bottom (floor)
			if (position.y > 0) {
				position.y = 0;
				velocityY = -velocityY * bounciness;
				// Only bounce if velocity is significant
				if (Math.abs(velocityY) < 80) {
					velocityY = 0;
					position.y = 0;
				} else {
					sendBounceMetrics();
				}
			}

			// reset velocity
			if (Math.abs(velocityX) < 5 && Math.abs(velocityY) < 5) {
				velocityX = 0;
				velocityY = 0;
			}

			// Update flip based on velocity
			if (Math.abs(velocityX) > 0.5) {
				flip = velocityX < 0;
			}

			targetRotation = velocityX * 0.02 + velocityY * 0.01;

			return;
		}

		// Normal movement when not physics-based
		let moveByX = moveTowards(position.x, targetX, speed * ((self.innerWidth ?? 1600.0) / 1600.0));
		position.x += moveByX;

		turnStrideWheel(moveByX);

		flip = moveByX < 0.0;
		if (moveByX > 0.1 || moveByX < -0.1) {
			sprite = strideAngle % Math.PI < Math.PI * 0.5 ? '/pet/walk1.webp' : '/pet/walk2.webp';
		} else {
			sprite = '/pet/idle.webp';
		}

		deltaTravelled += Math.abs(moveByX);
		updateDistanceTravelled();
	};

	if (browser) setInterval(move, tickRate);

	const shake = (event: DeviceMotionEvent) => {
		const accel = event.acceleration ?? event.accelerationIncludingGravity;
		if (accel === null || accel.x === null || accel.y === null) return;
		if (Math.abs(accel.x) + Math.abs(accel.y) < 40.0) return;
		// make it so that it amplifies motion proportionally to the window size
		const windowRatio = (window.innerWidth * 1.0) / (window.innerHeight * 1.0);
		velocityX += accel.x * windowRatio * 5.0;
		velocityY += accel.y * (1.0 / windowRatio) * 5.0;
		sprite = '/pet/pick.webp';
	};

	if (browser) self.ondevicemotion = shake;

	// this is for ios
	const askForShakePermission = () => {
		if (
			typeof DeviceMotionEvent !== 'undefined' &&
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			typeof (DeviceMotionEvent as any).requestPermission === 'function'
		) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(DeviceMotionEvent as any)
				.requestPermission()
				.then((permissionState: string) => {
					if (permissionState === 'granted') {
						self.ondevicemotion = shake;
					}
				})
				.catch(console.error);
		}
	};

	const pickNewTargetX = () => {
		const viewportWidth = self.innerWidth || null;
		if (viewportWidth !== null && Math.abs(position.x - targetX) < 5) {
			targetX = Math.max(
				Math.min(targetX + (Math.random() - 0.5) * (viewportWidth * 0.5), viewportWidth * 0.9),
				viewportWidth * 0.1
			);
		}
		// Set a random interval for the next target update (between 4-10 seconds)
		const randomDelay = Math.floor(Math.random() * 6000) + 4000;
		setTimeout(pickNewTargetX, randomDelay);
	};

	// Start the process
	if (browser) setTimeout(pickNewTargetX, 1000);
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<div
	use:draggable={{
		position,
		applyUserSelectHack: true,
		handle: 'img',
		bounds: {
			bottom: (window.innerHeight / 100) * 5.5
		},
		onDragStart: () => {
			sprite = '/pet/pick.webp';
			dragged = true;
		},
		onDrag: ({ offsetX, offsetY, event }) => {
			position.x = offsetX;
			position.y = offsetY;
			const mouseXD = event.movementX * delta;
			const mouseYD = event.movementY * delta;
			deltaTravelled += Math.sqrt(mouseXD ** 2 + mouseYD ** 2);
			// reset mouse movement if it's not moving in the same direction so it doesnt accumulate its weird!@!@
			mouseX = Math.sign(mouseXD) != Math.sign(mouseX) ? mouseXD : mouseX + mouseXD;
			mouseY = Math.sign(mouseYD) != Math.sign(mouseY) ? mouseYD : mouseY + mouseYD;
			rotationVelocity += mouseXD + mouseYD;
			lastDragged = Date.now();
		},
		onDragEnd: () => {
			// reset mouse movement if we stopped for longer than some time
			if (Date.now() - lastDragged > 50) {
				mouseX = 0.0;
				mouseY = 0.0;
			}
			// apply velocity based on rotation since we already keep track of that
			velocityX = mouseX * 70.0;
			velocityY = mouseY * 50.0;
			updateDistanceTravelled();
			// reset mouse movement we dont want it to accumulate
			mouseX = 0.0;
			mouseY = 0.0;
			dragged = false;
		}
	}}
	class="fixed bottom-[5vh] z-[1000] hover:animate-squiggle"
	style="cursor: url('/icons/gaze.webp'), pointer;"
>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<img
		draggable="false"
		onclick={askForShakePermission}
		style="
		  image-rendering: pixelated !important;
		  transform: rotate({rotation}rad) scaleX({flip ? -1 : 1});
		  filter: invert(100%) drop-shadow(2px 2px 0 black) drop-shadow(-2px -2px 0 black);
		"
		src={sprite}
	/>
</div>
