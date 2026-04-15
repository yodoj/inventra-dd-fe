<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Search, X } from 'lucide-vue-next';

interface Option {
  id: string | number;
  label: string;
  [key: string]: any;
}

const props = defineProps<{
  modelValue: string | number;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const searchQuery = ref('');
const dropdownRef = ref<HTMLElement | null>(null);

const selectedOption = computed(() => {
  return props.options.find(opt => opt.id === props.modelValue);
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter(opt => 
    opt.label.toLowerCase().includes(query)
  );
});

const toggleDropdown = () => {
  if (props.disabled || props.loading) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
  }
};

const selectOption = (option: Option) => {
  emit('update:modelValue', option.id);
  emit('change', option);
  isOpen.value = false;
  searchQuery.value = '';
};

const clearSelection = (event: Event) => {
  event.stopPropagation();
  emit('update:modelValue', '');
  emit('change', null);
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="searchable-select" :class="{ 'is-disabled': disabled, 'is-open': isOpen }" ref="dropdownRef">
    <div class="select-trigger" @click="toggleDropdown">
      <div class="selected-text" :class="{ 'placeholder': !selectedOption }">
        {{ selectedOption ? selectedOption.label : placeholder || 'Pilih...' }}
      </div>
      <div class="actions">
        <X v-if="selectedOption && !disabled" class="clear-icon" @click="clearSelection" />
        <ChevronDown class="chevron-icon" />
      </div>
    </div>

    <transition name="fade">
      <div v-if="isOpen" class="dropdown-panel shadow-lg">
        <div class="search-container">
          <Search class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-input" 
            placeholder="Cari..." 
            autofocus
            @click.stop
          />
        </div>
        
        <ul class="options-list">
          <li v-if="loading" class="option-item loading">Memuat...</li>
          <li v-else-if="filteredOptions.length === 0" class="option-item no-results">
            Tidak ada hasil ditemukan
          </li>
          <li 
            v-for="option in filteredOptions" 
            :key="option.id" 
            class="option-item"
            :class="{ 'is-selected': option.id === modelValue }"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.searchable-select {
  position: relative;
  width: 100%;
  font-family: inherit;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 46px;
}

.searchable-select.is-open .select-trigger {
  border-color: #00588F;
  box-shadow: 0 0 0 2px rgba(0, 88, 143, 0.1);
}

.is-disabled .select-trigger {
  background-color: #F3F4F6;
  cursor: not-allowed;
  opacity: 0.7;
}

.selected-text {
  font-size: 14px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.selected-text.placeholder {
  color: #9CA3AF;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chevron-icon {
  width: 18px;
  height: 18px;
  color: #6B7280;
}

.clear-icon {
  width: 16px;
  height: 16px;
  color: #9CA3AF;
  cursor: pointer;
}

.clear-icon:hover {
  color: #6B7280;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  z-index: 1000;
  overflow: hidden;
}

.search-container {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #F3F4F6;
  background: #F9FAFB;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: #9CA3AF;
  margin-right: 8px;
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #111827;
}

.options-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
  margin: 0;
  list-style: none;
}

.options-list::-webkit-scrollbar {
  width: 6px;
}

.options-list::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 10px;
}

.option-item {
  padding: 10px 16px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background 0.2s;
}

.option-item:hover {
  background-color: #F3F4F6;
  color: #00588F;
}

.option-item.is-selected {
  background-color: #EBF5FF;
  color: #00588F;
  font-weight: 600;
}

.option-item.no-results, .option-item.loading {
  color: #9CA3AF;
  text-align: center;
  cursor: default;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
