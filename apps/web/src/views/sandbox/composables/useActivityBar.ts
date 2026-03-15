import type { ActivityItem, ActivityPanelId } from '../typing'
import { computed, ref } from 'vue'

export function useActivityBar() {
  const activePanel = ref<ActivityPanelId>('explorer')
  const sidebarVisible = ref(true)

  const items = computed<ActivityItem[]>(() => [
    {
      id: 'explorer',
      label: '资源管理器',
      icon: activePanel.value === 'explorer' && sidebarVisible.value ? 'FolderOpened' : 'Folder',
    },
    { id: 'theme', label: '外观', icon: 'Brush' },
  ])

  function togglePanel(id: ActivityPanelId) {
    if (activePanel.value === id) {
      sidebarVisible.value = !sidebarVisible.value
    }
    else {
      activePanel.value = id
      sidebarVisible.value = true
    }
  }

  return {
    activePanel,
    items,
    sidebarVisible,
    togglePanel,
  }
}
