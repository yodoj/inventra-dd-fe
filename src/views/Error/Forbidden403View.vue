<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="not-found-container">
    <div class="content-wrapper">
      <h2 class="oops-text">OOOPS!!</h2>
      <h1 class="error-number">403</h1>
      <h3 class="page-not-found-text">RESTRICTED AREA</h3>
      <p class="description-text">
        This area is restricted. Please contact admin if you think<br class="hidden-mobile" />
        this is a mistake.
      </p>
      <button @click="router.back()" class="back-button">
        Go Back
      </button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.content-wrapper {
  text-align: center;
  max-width: 800px;
  padding: 0 20px;
  margin-top: -5vh; 
}

.oops-text {
  font-size: 32px;
  font-weight: 800;
  color: #000000;
  margin-bottom: 0px;
  letter-spacing: 0.5px;
}

.error-number {
  font-size: 300px;
  font-weight: 700;
  color: #669bbc; 
  text-shadow: 
    -2px -2px 0 #333333,
     0   -2px 0 #333333,
     2px -2px 0 #333333,
     2px  0   0 #333333,
     2px  2px 0 #333333,
     0    2px 0 #333333,
    -2px  2px 0 #333333,
    -2px  0   0 #333333;
  margin: -30px 0; 
  letter-spacing: -5px;
}

.page-not-found-text {
  font-size: 36px;
  font-weight: 800;
  color: #000000;
  margin-top: 0px;
  margin-bottom: 20px;
}

.description-text {
  font-size: 18px;
  color: #6B7280; 
  line-height: 1.6;
  margin-bottom: 36px;
  font-weight: 400;
}

.back-button {
  display: inline-block;
  background-color: #00588F;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 50px; 
  border: none;
  cursor: pointer;
  box-shadow: 0px 10px 20px rgba(0, 88, 143, 0.2);
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #004b7a;
  transform: translateY(-2px);
  box-shadow: 0px 12px 24px rgba(0, 88, 143, 0.3);
}

.back-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .error-number {
    font-size: 180px;
    text-shadow: 
      -1.5px -1.5px 0 #333333,
       0     -1.5px 0 #333333,
       1.5px -1.5px 0 #333333,
       1.5px  0     0 #333333,
       1.5px  1.5px 0 #333333,
       0      1.5px 0 #333333,
      -1.5px  1.5px 0 #333333,
      -1.5px  0     0 #333333;
    margin: -10px 0;
  }
  .oops-text {
    font-size: 24px;
  }
  .page-not-found-text {
    font-size: 26px;
  }
  .description-text {
    font-size: 16px;
  }
  .hidden-mobile {
    display: none;
  }
}

@media (max-width: 480px) {
  .error-number {
    font-size: 140px;
    text-shadow: 
      -1px -1px 0 #333333,
       0   -1px 0 #333333,
       1px -1px 0 #333333,
       1px  0   0 #333333,
       1px  1px 0 #333333,
       0    1px 0 #333333,
      -1px  1px 0 #333333,
      -1px  0   0 #333333;
  }
}
</style>