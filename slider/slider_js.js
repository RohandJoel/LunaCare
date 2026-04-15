
async function loadStories() {
  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbxJxPxslDmAZtOi9C3oGVoYs5_ICf68dYrb6NuiQpWomty_odBsH6y8KeDJeWy2maS0/exec"
  );

  const stories = await res.json();
  const slider = document.getElementById("storySlider");

  slider.innerHTML = ""; // clear old items

  stories.forEach(s => {
    slider.innerHTML += `
      <div class="story-card">
        <h3>${s.name} (${s.age})</h3>
        <p>${s.story}</p>
      </div>
    `;
  });
}

loadStories();

