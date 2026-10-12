<template>
  <div>
    <!-- Mobile Backdrop -->
    <div
      v-if="isSidebarOpen"
      data-testid="sidebar-backdrop"
      @click="$emit('close-mobile')"
      class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
    />

    <aside
      class="fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200/80 p-4 transition-transform duration-200 ease-in-out md:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex flex-col h-full justify-between">
        <div class="space-y-6">
          <div>
            <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-600">
              Menu Utama
            </p>
            <nav class="mt-3 space-y-1">
              <RouterLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :exact="item.exact"
                @click="$emit('close-mobile')"
                custom
                v-slot="{ href, navigate, isActive, isExactActive }"
              >
                <a
                  :href="href"
                  @click="navigate"
                  class="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  :class="
                    (item.exact ? isExactActive : isActive)
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  "
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="item.icon"
                      :size="20"
                      :class="
                        (item.exact ? isExactActive : isActive)
                          ? 'text-white'
                          : 'text-slate-600 group-hover:text-slate-600'
                      "
                    />
                    <span>{{ item.label }}</span>
                  </div>
                  <ChevronRight
                    v-if="item.exact ? isExactActive : isActive"
                    :size="16"
                  />
                </a>
              </RouterLink>
            </nav>
          </div>
        </div>

        <!-- Footer note in sidebar -->
        <div class="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100/60">
          <p class="text-xs font-semibold text-indigo-900">
            Delcom Cash Flow · PABWE 2026
          </p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { LayoutDashboard, Users, UserCircle, ChevronRight } from "lucide-vue-next";

interface SidebarProps {
  isSidebarOpen?: boolean;
}

withDefaults(defineProps<SidebarProps>(), {
  isSidebarOpen: false,
});

defineEmits<{
  "close-mobile": [];
}>();

const navItems = [
  {
    to: "/",
    label: "Ringkasan Arus Kas",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/users",
    label: "Direktori Pengguna",
    icon: Users,
    exact: false,
  },
  {
    to: "/profile",
    label: "Profil Saya",
    icon: UserCircle,
    exact: false,
  },
];
</script>
