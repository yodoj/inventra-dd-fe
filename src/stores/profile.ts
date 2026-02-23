import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface ProfileData {
  id?: string;
  fullName: string;
  email: string;
  role: string;
  unit: string;
  phoneNumber?: string;
  nisn?: string;
  kelas?: string;
  avatar?: string;
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<ProfileData | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isSiswa = computed(() => {
    return profile.value?.role === 'SISWA' || profile.value?.role === 'siswa';
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  async function fetchProfile(userId?: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Replace with actual API call
      // const response = await fetch(`/api/profile/${userId}`);
      // const data = await response.json();
      // profile.value = data;

      // Mock data for now
      profile.value = {
        id: '1',
        fullName: 'Ibuprofen Propensi',
        email: 'ibuprofen@diandidaktika.sch.id',
        role: 'SARPRAS',
        unit: 'SMP',
        phoneNumber: '08123456789'
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch profile';
    } finally {
      isLoading.value = false;
    }
  }

  function setProfile(data: ProfileData) {
    profile.value = data;
  }

  function updateProfile(data: Partial<ProfileData>) {
    if (profile.value) {
      profile.value = { ...profile.value, ...data };
    }
  }

  function clearProfile() {
    profile.value = null;
    error.value = null;
  }

  return {
    profile,
    isLoading,
    error,
    isSiswa,
    fetchProfile,
    setProfile,
    updateProfile,
    clearProfile,
    getInitials
  };
});
