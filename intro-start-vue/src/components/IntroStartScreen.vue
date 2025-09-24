<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import 'animate.css';
import '../styles/IntroStartScreen.css';
import WCFINDER from '../assets/WCFINDER.webp';
import GHOST1 from '../assets/Ally Geister.png';
import GHOST2 from '../assets/Ally Ghost Green.png';
import GHOST3 from '../assets/Ally Orange.png';
import GlowingBackground from '../layout/GlowingBackground.vue';

type Ghost = { topPct: number; leftPct: number; src: string; delaySec: number; scale: number };

/* utilities */
function useCountUp(target = 145, durationMs = 1500, start = 1, delayMs = 0) {
  const value = ref(start);
  let raf = 0;
  let timer: number | undefined;

  const startAnim = () => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      value.value = Math.floor(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  onMounted(() => {
    timer = delayMs > 0 ? window.setTimeout(startAnim, delayMs) : undefined;
    if (!timer) startAnim();
  });

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
  });

  return value;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGhostsAnnulus(
  count = 18,
  rXPct = 30,
  rYPct = 24,
  thicknessPct = 15,
  angleJitterDeg = 18,
  startDelaySec = 0,
  stepDelaySec = 0.08,
  seed = 1337
): Ghost[] {
  const images = [GHOST1, GHOST2, GHOST3];
  const out: Ghost[] = [];
  const rand = mulberry32(seed);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const baseAngle = i * golden;
    const jitterA = ((rand() * 2 - 1) * angleJitterDeg * Math.PI) / 180;
    const rJ = (rand() * 2 - 1) * (thicknessPct / 2);
    const rX = rXPct + rJ * (0.9 + rand() * 0.2);
    const rY = rYPct + rJ * (0.9 + rand() * 0.2);
    const driftX = (rand() * 2 - 1) * 1.6;
    const driftY = (rand() * 2 - 1) * 1.0;

    const a = baseAngle + jitterA;
    const leftPct = 50 + driftX + rX * Math.cos(a);
    const topPct = 50 + driftY + rY * Math.sin(a);

    const scale = 0.88 + rand() * 0.18;
    const delaySec = startDelaySec + i * stepDelaySec;

    out.push({ topPct, leftPct, src: images[i % images.length], delaySec, scale });
  }
  return out;
}

/* state + timings */
const closing = ref(false);
const logoReady = ref(false);

const LOGO_DELAY_MS = 350;
const LOGO_DURATION_MS = 500;
const GHOSTS_START_OFFSET_MS = 150;
const GHOST_STAGGER_SEC = 0.09;
const AUTO_CLOSE_MS = 3500;

/* heartbeat overlaps fade/zoom, lasts longer */
const HEARTBEAT_OFFSET_MS = 120;
const HEARTBEAT_DURATION_MS = 1500;
const HEARTBEAT_DELAY_MS = LOGO_DELAY_MS + HEARTBEAT_OFFSET_MS;

/* chip/glow gating */
const CHIP_DELAY = 1000;
const CHIP_ANIM_MS = 500;
const GLOW_OFFSET = 150;

const chipVisible = ref(false);
const chipAppeared = ref(false);
const glowVisible = ref(false);

/* timers */
const timers: number[] = [];
onMounted(() => {
  timers.push(window.setTimeout(() => (chipVisible.value = true), CHIP_DELAY));
  timers.push(window.setTimeout(() => (closing.value = true), AUTO_CLOSE_MS));
});
onBeforeUnmount(() => timers.forEach(clearTimeout));

watch(chipVisible, (v) => {
  if (!v) return;
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced) {
    timers.push(window.setTimeout(() => (chipAppeared.value = true), 20));
  } else {
    timers.push(window.setTimeout(() => (chipAppeared.value = true), CHIP_ANIM_MS + 120));
  }
});
watch(chipAppeared, (v) => {
  if (!v) return;
  timers.push(window.setTimeout(() => (glowVisible.value = true), GLOW_OFFSET));
});

/* ghosts timing and data */
const ghostsStartDelaySec = computed(
  () =>
    ((LOGO_DELAY_MS + LOGO_DURATION_MS + GHOSTS_START_OFFSET_MS) + (logoReady.value ? 0 : 200)) /
    1000
);
const ghosts = computed(() =>
  buildGhostsAnnulus(30, 45, 30, 25, 18, ghostsStartDelaySec.value, GHOST_STAGGER_SEC, 1337)
);

/* count-up */
const userCount = useCountUp(145, 1200, 1, CHIP_DELAY);

/* handlers */
function handleExitEnd(e: AnimationEvent) {
  if (!closing.value) return;
  if (e.target === e.currentTarget) {
    // In this mini demo we just hide the screen; replace with router.push in a real app
    // (or emit an event)
  }
}
function onChipAnimationEnd(e: AnimationEvent) {
  if (e.target === e.currentTarget) chipAppeared.value = true;
}
</script>

<template>
  <div
    class="intro__screen"
    :class="closing ? 'animate__animated animate__fadeOut animate__faster' : ''"
    @animationend="handleExitEnd"
  >
    <!-- Background slot -->
    <div
      class="intro__bgSlot"
      :class="!closing ? 'animate__animated animate__fadeIn' : ''"
      :style="{ animationDelay: `${LOGO_DELAY_MS}ms` }"
      aria-hidden="true"
    >
      <GlowingBackground />
    </div>

    <!-- Close/X -->
    <button
      class="intro__close"
      aria-label="Schließen"
      @click="closing = true"
      :disabled="closing"
    >
      <span aria-hidden="true">×</span>
    </button>

    <!-- Center logo -->
    <div
      class="intro__logoScope"
      :class="logoReady && !closing ? 'animate__animated animate__zoomIn animate__faster' : ''"
      :style="{ animationDelay: `${LOGO_DELAY_MS}ms` }"
    >
      <img
        :src="WCFINDER"
        alt="App logo"
        @load="logoReady = true"
        class="intro__logoImg"
        :class="logoReady && !closing ? 'animate__animated animate__heartBeat' : ''"
        :style="{
          '--animate-duration': `${HEARTBEAT_DURATION_MS}ms`,
          animationDelay: `${HEARTBEAT_DELAY_MS}ms`,
          opacity: logoReady ? 1 : 0
        }"
        draggable="false"
      />
    </div>

    <!-- Ghosts -->
    <div class="intro__field" aria-hidden="true">
      <div
        v-for="(g, i) in ghosts"
        :key="i"
        class="ghost"
        :class="!closing ? 'animate__animated animate__fadeIn animate__faster' : ''"
        :style="{
          top: `${g.topPct}%`,
          left: `${g.leftPct}%`,
          transform: 'translate(-50%, -50%)',
          animationDelay: `${g.delaySec}s`,
        }"
      >
        <img
          :src="g.src"
          alt=""
          class="ghost__img"
          :style="{ transform: `scale(${g.scale})`, animationDelay: `${g.delaySec}s` }"
          draggable="false"
        />
      </div>
    </div>

    <!-- Bottom text + chip -->
    <div class="intro__bottom">
      <h1
        class="intro__headline"
        :class="!closing ? 'animate__animated animate__fadeInUp' : ''"
        style="animation-delay: 600ms"
      >
        Du packst das!
      </h1>

      <div class="intro__chipWrap">
        <div
          v-if="glowVisible"
          class="chipGlowHaze animate__animated animate__fadeIn animate__faster"
          aria-hidden="true"
        />
        <div
          class="intro__chip"
          :class="chipVisible && !closing ? 'animate__animated animate__fadeInUp animate__faster' : ''"
          :style="{ visibility: chipVisible ? 'visible' : 'hidden' }"
          @animationend="onChipAnimationEnd"
        >
          <div>Mit dir sind gerade</div>
          <strong>{{ userCount }} Nutzer:innen online</strong>
        </div>
      </div>
    </div>
  </div>
</template>
