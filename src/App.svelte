<script>
  export let config;

  let settings = false;

  let d = new Date();
  $: hours = twoDigits(d.getHours() % 12 === 0 ? 12 : d.getHours() % 12);
  $: minutes = twoDigits(d.getMinutes());
  $: date = d.toLocaleDateString("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  $: greeting =
    d.getHours() < 2
      ? "night"
      : d.getHours() < 12
      ? "morning"
      : d.getHours() < 18
      ? "afternoon"
      : d.getHours() < 22
      ? "evening"
      : "night";

  let weather;
  let weatherClass = "none";
  let temperature = 0;
  let town = $config.location;

  const timeInterval = setInterval(() => {
    d = new Date();
  }, 1000);

  const weatherInterval = setInterval(() => {
    updateWeather();
  }, 300000);

  config.subscribe((value) => {
    updateWeather();
  });

  async function updateWeather() {
    const res = await fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${$config.location}&units=${$config.units}&appid=${$config.apiKey}`
    );
    if (!res.ok) {
      // console.log(res);
      console.warn(
        "Your Openweathermap API key is probably missing or invalid."
      );
      return;
    }
    weather = await res.json();
    // console.log(weather);
    temperature = Math.round(weather.main.temp);
    if (weather.weather[0].main === "Clear") {
      let time = Math.floor(d / 1000);
      if (time < weather.sys.sunrise || time > weather.sys.sunset) {
        weatherClass = "moon";
      } else {
        weatherClass = "sun";
      }
    } else if (
      weather.weather[0].main === "Rain" ||
      weather.weather[0].main === "Drizzle" ||
      weather.weather[0].main === "Thunderstorm"
    ) {
      weatherClass = "rain";
    } else if (weather.weather[0].main === "Snow") {
      weatherClass = "snow";
    } else {
      weatherClass = "cloud";
    }
  }

  function twoDigits(n) {
    return n < 10 ? "0" + n : n;
  }
</script>

<main>
  <div id="content">
    <div id="image-container">
      <img id="image" src="build/1.gif" alt="" />
      <div id="time">{hours}:{minutes}</div>
    </div>
    <div id="box">
      {#if !settings}
        <div id="heading-container">
          <div id="heading">
            <h1 id="greeting">
              Good {greeting}{$config.name ? ", " + $config.name : ""}.
            </h1>
            <h2 id="date">Today is {date}.</h2>
          </div>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div id="weather-container" on:click={updateWeather}>
            {#if weather}
              <div class="weather-icon {weatherClass}" />
              <span>
                <div id="temperature">{temperature}°</div>
                <div id="location">in {town}</div>
              </span>
            {/if}
          </div>
        </div>
        <div id="links">
          {#each $config.links as column}
            <div class="link-column">
              {#each column as link}
                <a href={link.url}>
                  <span class="arrow">></span>
                  <span class="text">{link.name}</span>
                </a>
                <br />
              {/each}
            </div>
          {/each}
        </div>
      {:else}
        <div id="settings">
          <h2 id="settings-header">Settings</h2>
          <div class="label">Name</div>
          <input type="text" bind:value={$config.name} />
          <div class="label">Location</div>
          <input type="text" bind:value={$config.location} />
          <div class="label">Openweathermap API key</div>
          <input type="text" bind:value={$config.apiKey} />
          <div class="label">Units</div>
          <select bind:value={$config.units}>
            <option value="metric">metric</option>
            <option value="imperial">imperial</option>
          </select>
        </div>
      {/if}
    </div>
  </div>
  <div id="corner">
    <button id="settings-button" on:click={() => (settings = !settings)}>
      settings
    </button>
    <a href="#" id="version">v1.2.2</a>
  </div>
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    padding-inline: 2rem;
    padding-bottom: 4rem;
  }

  #content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    animation: appear 0.3s ease-out forwards;
  }
  #image-container {
    width: 44rem;
    height: 26rem;
    position: relative;
    margin: auto;
    overflow: hidden;
    border-radius: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    scale: 0.65;
    margin-bottom: -5rem;
    border: 5px solid #d7827e;
  }
  #image {
    position: absolute;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
    filter: hue-rotate(-5deg) saturate(45%) brightness(75%);
  }
  #time {
    text-shadow: 5px 5px #d7827e;
    animation: time-appear 0.3s ease-out 0.2s forwards;
    font-size: 6rem;
    overflow-wrap: break-word;
    text-align: center;
    color: var(--text-color);
    transform: scale(0);
  }
  #box {
    padding: 2rem 3rem 3rem 3rem;
    background: var(--bg2-color);
    border-radius: 2rem;
    overflow: hidden;
    transition: width 0.2s ease;
  }
  #heading-container {
    margin-inline: auto;
    width: 86%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    justify-content: center;
  }
  #heading {
    justify-self: start;
  }
  #weather-container {
    justify-self: end;
    width: 12rem;
    height: min-content;
    margin-left: 4rem;
    opacity: 0;
    animation: weather-appear 0.3s ease-out 0.2s forwards;
  }
  #weather-container:hover {
    cursor: pointer;
  }
  .weather-icon {
    float: right;
  }
  #temperature {
    display: inline-block;
    font-size: 1.5rem;
    vertical-align: top;
    margin-right: 0.75rem;
  }
  #location {
    white-space: nowrap;
  }
  #weather-container span {
    display: inline-flex;
    margin-top: 2rem;
    align-items: end;
  }
  h1 {
    margin: 0;
    font: inherit;
    font-size: 2rem;
  }
  #greeting {
    white-space: nowrap;
    margin-bottom: 2rem;
    margin-right: 2rem;
    opacity: 0;
    animation: text-appear 0.3s ease-out 0.2s forwards;
  }
  #settings-header {
    margin-bottom: 1rem;
  }
  h2 {
    margin: 0;
    font: inherit;
    font-size: 1.5rem;
  }
  #date {
    margin-bottom: 2.5rem;
    opacity: 0;
    animation: text-appear 0.3s ease-out 0.225s forwards;
  }
  .label {
    margin: 1rem 0 0.25rem 0;
    font: inherit;
    font-size: 0.8rem;
  }
  #links {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin: 0;
    gap: 2rem;
  }
  .link-column {
    opacity: 0;
    animation: text-appear 0.3s ease-out 0.25s forwards;
    background: #201d2f;
    border-radius: 1rem;
    padding: 1.5rem 1.5rem 1.5rem 3rem;
    font-size: 1rem;
    height: fit-content;
  }
  button {
    background: none;
    border: none;
    font: inherit;
    padding: none;
    color: var(--text-dark-color);
    transition: 0.2s ease;
  }
  a {
    display: inline-block;
    text-decoration: none;
    color: var(--text-dark-color);
    transition: 0.2s ease;
    margin-bottom: 1rem;
  }
  a:last-of-type {
    margin-bottom: 0;
  }
  .arrow {
    display: inline-block;
    transform: translate(-22px);
    opacity: 0;
    transition: 0.2s ease;
  }
  .text {
    display: inline-block;
    transform: translate(-22px);
    transition: 0.2s ease;
  }
  a:hover,
  button:hover {
    color: var(--text-color);
    cursor: pointer;
  }
  a:hover .arrow {
    transform: none;
    opacity: 1;
  }
  a:hover .text {
    transform: none;
  }
  a:active:hover,
  button:active:hover {
    transform: scale(0.9);
  }
  select,
  input {
    background: var(--bg-color);
    border: none;
    font: inherit;
    color: inherit;
    padding: 0.5rem;
    border-radius: 0.5rem;
    width: 100%;
  }
  select {
    padding: 0.5rem;
  }
  #settings {
    width: 25rem;
  }
  #corner {
    position: absolute;
    padding: 1rem;
    bottom: 0;
    right: 0;
    opacity: 0;
    transition: 0.2s ease;
  }
  #corner:hover {
    opacity: 1;
  }
  #version {
    margin: 0;
  }
</style>
