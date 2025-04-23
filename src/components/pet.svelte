<script lang="ts">
	import { draggable } from '@neodrag/svelte';

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

	let targetRotation = $state(0.0);
	let rotationVelocity = $state(0.0);
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
	setInterval(updateRotationSpring, tickRate);

	const lerp = (from: number, to: number, weight: number) => {
		return from + (to - from) * weight;
	};

	const moveTowards = (from: number, to: number, by: number) => {
		let d = (to - from) * 1.0;
		let l = Math.abs(d);
		let s = Math.sign(d);
		let moveBy = s * Math.min(l, by) * delta;
		return moveBy;
	};

	const move = () => {
		if (dragged) {
			return;
		}

		if (position.y !== 0) {
			position.y = Math.ceil(lerp(position.y, 0.0, 0.2));
			return;
		}

		let moveByX = moveTowards(position.x, targetX, speed);
		position.x += moveByX;

		turnStrideWheel(moveByX);

		flip = moveByX < 0.0;
		if (moveByX > 0.1 || moveByX < -0.1) {
			sprite = strideAngle % Math.PI < Math.PI * 0.5 ? '/pet/walk1.webp' : '/pet/walk2.webp';
		} else {
			sprite = '/pet/idle.webp';
		}
	};

	setInterval(move, tickRate);

	const pickNewTargetX = () => {
		const viewportWidth = self.innerWidth || null;
		if (viewportWidth !== null && Math.abs(position.x - targetX) < 5) {
			targetX = Math.max(
				Math.min(targetX + (Math.random() - 0.5) * 500.0, viewportWidth * 0.9),
				viewportWidth * 0.1
			);
		}
		// Set a random interval for the next target update (between 4-10 seconds)
		const randomDelay = Math.floor(Math.random() * 6000) + 4000;
		setTimeout(pickNewTargetX, randomDelay);
	};

	// Start the process
	setTimeout(pickNewTargetX, 1000);
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
			rotationVelocity += event.movementY * delta + event.movementX * delta;
		},
		onDragEnd: () => {
			dragged = false;
		}
	}}
	class="absolute bottom-[5vh] z-[1000] hover:animate-squiggle"
	style="cursor: url('/icons/gaze.webp'), pointer;"
>
	<img
		draggable="false"
		style="
		  image-rendering: pixelated !important;
		  transform: rotate({rotation}rad) scaleX({flip ? -1 : 1});
		  filter: invert(100%) drop-shadow(2px 2px 0 black) drop-shadow(-2px -2px 0 black);
		"
		src={sprite}
	/>
</div>
