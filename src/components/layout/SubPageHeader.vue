<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    default: '',
  },
  breadcrumb: {
    type: Array,
    default: () => [],
  },
})

const crumbs = computed(() =>
  (props.breadcrumb || []).map((label, index, list) => ({
    label: String(label),
    isLast: index === list.length - 1,
    isHome: index === 0 && String(label) === '홈',
  })),
)
</script>

<template>
  <header class="bg-slate-800 text-white">
    <div class="mx-auto max-w-[1100px] px-4 py-8 md:py-10">
      <nav v-if="crumbs.length" aria-label="breadcrumb" class="mb-3">
        <ol class="flex flex-wrap items-center gap-1 text-xs text-slate-300">
          <li v-for="(crumb, index) in crumbs" :key="`${crumb.label}-${index}`" class="flex items-center gap-1">
            <ChevronRight v-if="index > 0" :size="12" class="shrink-0 text-slate-500" aria-hidden="true" />
            <RouterLink
              v-if="crumb.isHome && !crumb.isLast"
              to="/"
              class="transition-colors hover:text-white"
            >
              {{ crumb.label }}
            </RouterLink>
            <span
              v-else
              :class="crumb.isLast ? 'font-semibold text-white' : 'text-slate-300'"
              :aria-current="crumb.isLast ? 'page' : undefined"
            >
              {{ crumb.label }}
            </span>
          </li>
        </ol>
      </nav>

      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">{{ title }}</h1>
      <p v-if="desc" class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
        {{ desc }}
      </p>
    </div>
  </header>
</template>
