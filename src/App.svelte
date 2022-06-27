<script>
	export let config

	let settings = false

	let gif = Math.floor(Math.random() * 5) + 1

	let d = new Date()
	$: hours = twoDigits(d.getHours() % 12 === 0 ? 12 : d.getHours() % 12)
	$: minutes = twoDigits(d.getMinutes())
	$: date = d.toLocaleDateString('en', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
	$: greeting =
		d.getHours() < 2
			? 'night'
			: d.getHours() < 12
			? 'morning'
			: d.getHours() < 18
			? 'afternoon'
			: d.getHours() < 22
			? 'evening'
			: 'night'

	let weather
	let weatherClass = 'none'
	let temperature = 0

	const timeInterval = setInterval(() => {
		d = new Date()
	}, 1000)

	const weatherInterval = setInterval(() => {
		updateWeather()
	}, 300000)

	config.subscribe((value) => {
		updateWeather()
	})

	async function updateWeather() {
		const res = await fetch(
			`http://api.openweathermap.org/data/2.5/weather?q=${$config.location}&units=${$config.units}&appid=${$config.apiKey}`
		)
		if (!res.ok) {
			console.log(res)
			console.warn(
				'Your Openweathermap API key is probably missing or invalid.'
			)
			return
		}
		weather = await res.json()
		console.log(weather)
		temperature = Math.round(weather.main.temp)
		if (weather.weather[0].main === 'Clear') {
			let time = Math.floor(d / 1000)
			if (time < weather.sys.sunrise || time > weather.sys.sunset) {
				weatherClass = 'moon'
			} else {
				weatherClass = 'sun'
			}
		} else if (
			weather.weather[0].main === 'Rain' ||
			weather.weather[0].main === 'Drizzle' ||
			weather.weather[0].main === 'Thunderstorm'
		) {
			weatherClass = 'rain'
		} else if (weather.weather[0].main === 'Snow') {
			weatherClass = 'snow'
		} else {
			weatherClass = 'cloud'
		}
	}

	function twoDigits(n) {
		return n < 10 ? '0' + n : n
	}
</script>

<main>
	<div id="content">
		<div id="image-container">
			<img
				id="image"
				src={'gifs/' + gif + '.gif'}
				alt=""
				on:click={() => (gif = Math.floor(Math.random() * 5) + 1)}
			/>
			<div id="time">{hours}-{minutes}</div>
		</div>
		<div id="box">
			{#if !settings}
				<div id="heading-container">
					<div id="heading">
						<h1 id="greeting">
							Good {greeting}{$config.name
								? ', ' + $config.name
								: ''}.
						</h1>
						<h2 id="date">Today is {date}.</h2>
					</div>
					<div id="weather-container" on:click={updateWeather}>
						{#if weather}
							<div id="temperature">{temperature}°</div>
							<div class="weather-icon {weatherClass}" />
						{/if}
					</div>
				</div>
				<div id="links">
					<div class="link-column" id="link-column-1">
						{#each $config.links[0] as link}
							<a href={link.url}>
								<span class="arrow">></span>
								<span class="text">{link.name}</span>
							</a>
							<br />
						{/each}
					</div>
					<div class="link-column" id="link-column-2">
						{#each $config.links[1] as link}
							<a href={link.url}>
								<span class="arrow">></span>
								<span class="text">{link.name}</span>
							</a>
							<br />
						{/each}
					</div>
					<div class="link-column" id="link-column-3">
						{#each $config.links[2] as link}
							<a href={link.url}>
								<span class="arrow">></span>
								<span class="text">{link.name}</span>
							</a>
							<br />
						{/each}
					</div>
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
		<a href="https://github.com/refact0r/startpage" id="version">v1.2.4</a>
	</div>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}
	#content {
		display: flex;
		animation: appear 0.3s ease-out forwards;
		height: 27.5rem;
	}
	#image-container {
		width: 16.5rem;
		height: inherit;
		position: relative;
		margin-right: 3rem;
		overflow: hidden;
		border-radius: 2rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	#image {
		position: absolute;
		height: inherit;
	}
	#image:hover {
		cursor: pointer;
	}
	#time {
		width: 5rem;
		padding: 1rem;
		background: hsla(0, 0%, 0%, 0.4);
		border-radius: 1rem;
		animation: time-appear 0.3s ease-out 0.2s forwards;
		font-size: 3rem;
		overflow-wrap: break-word;
		text-align: center;
		color: white;
		mix-blend-mode: overlay;
		transform: scale(0);
		backdrop-filter: blur(3px);
	}
	#box {
		padding: 3rem;
		background: var(--bg2-color);
		border-radius: 2rem;
		overflow: hidden;
		transition: width 0.2s ease;
	}
	#heading-container {
		width: 100%;
		display: flex;
	}
	#weather-container {
		text-align: right;
		width: 7rem;
		height: min-content;
		margin-left: 4rem;
		opacity: 0;
		animation: weather-appear 0.3s ease-out 0.2s forwards;
	}
	#weather-container:hover {
		cursor: pointer;
	}
	#temperature {
		display: inline-block;
		margin: 0.2rem 0 0 0;
		font-size: 1.5rem;
		vertical-align: top;
	}
	h1 {
		margin: 0;
		font: inherit;
		font-size: 2rem;
	}
	#greeting {
		margin-bottom: 2rem;
		opacity: 0;
		animation: text-appear 0.3s ease-out 0.2s forwards;
	}
	#settings-header {
		margin-bottom: 1.5rem;
	}
	h2 {
		margin: 0;
		font: inherit;
		font-size: 1.5rem;
	}
	#date {
		margin-bottom: 3.5rem;
		opacity: 0;
		animation: text-appear 0.3s ease-out 0.225s forwards;
	}
	.label {
		margin: 1rem 0 0.25rem 0;
		font: inherit;
		font-size: 1rem;
	}
	#links {
		display: flex;
		justify-content: space-between;
		margin: 0;
	}
	.link-column {
		opacity: 0;
	}
	#link-column-1 {
		animation: text-appear 0.3s ease-out 0.25s forwards;
	}
	#link-column-2 {
		animation: text-appear 0.3s ease-out 0.275s forwards;
	}
	#link-column-3 {
		animation: text-appear 0.3s ease-out 0.3s forwards;
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
		margin-bottom: 2rem;
	}
	a:last-child {
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
