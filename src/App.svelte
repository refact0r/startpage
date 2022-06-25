<script>
	export let name
	export let location

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
	let description = ''
	updateWeather()

	function updateWeather() {
		fetch(
			`http://api.openweathermap.org/data/2.5/weather?q=${location}&units=imperial&appid=a5e6b61a6582627548b56770a547df5e`
		)
			.then((res) => res.json())
			.then((out) => {
				weather = out
				console.log(weather)
				temperature = Math.round(weather.main.temp)
				description =
					weather.weather[0].description[0].toUpperCase() +
					weather.weather[0].description.substring(1)
				if (weather.weather[0].main === 'Clear') {
					let time = Math.floor(date / 1000)
					console.log(time)
					if (
						time < weather.sys.sunrise ||
						time > weather.sys.sunset
					) {
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
			})
			.catch((err) => {
				console.log(err)
				weather = null
			})
	}

	const timeInterval = setInterval(() => {
		d = new Date()
	}, 1000)

	const weatherInterval = setInterval(() => {
		updateWeather()
	}, 300000)

	function twoDigits(n) {
		return n < 10 ? '0' + n : n
	}
</script>

<main>
	<div id="box">
		<div id="image-container">
			<img
				id="image"
				src={'gifs/' + gif + '.gif'}
				alt=""
				on:click={() => (gif = Math.floor(Math.random() * 5) + 1)}
			/>
			<div id="time">{hours}-{minutes}</div>
		</div>
		<div id="inner-box">
			<h1 id="header-1">Good {greeting}{name ? ', ' + name : ''}.</h1>
			<h2 id="header-2">Today is {date}.</h2>
			<div id="links">
				<div class="link-column" id="link-column-1">
					<a href="https://mail.google.com">
						<span class="arrow">></span>
						<span class="text">gmail</span>
					</a>
					<br />
					<a href="https://calendar.google.com">
						<span class="arrow">></span>
						<span class="text">calendar</span>
					</a>
					<br />
					<a href="https://drive.google.com">
						<span class="arrow">></span>
						<span class="text">drive</span>
					</a>
					<br />
					<a href="https://docs.google.com">
						<span class="arrow">></span>
						<span class="text">docs</span>
					</a>
				</div>
				<div class="link-column" id="link-column-2">
					<a href="https://github.com">
						<span class="arrow">></span>
						<span class="text">github</span>
					</a>
					<br />
					<a href="https://translate.google.com">
						<span class="arrow">></span>
						<span class="text">translate</span>
					</a>
					<br />
					<a href="https://finance.yahoo.com">
						<span class="arrow">></span>
						<span class="text">finance</span>
					</a>
					<br />
					<a href="https://monkeytype.com">
						<span class="arrow">></span>
						<span class="text">type</span>
					</a>
				</div>
				<div class="link-column" id="link-column-3">
					<a href="https://youtube.com">
						<span class="arrow">></span>
						<span class="text">youtube</span>
					</a>
					<br />
					<a href="https://twitch.tv">
						<span class="arrow">></span>
						<span class="text">twitch</span>
					</a>
					<br />
					<a href="https://reddit.com">
						<span class="arrow">></span>
						<span class="text">reddit</span>
					</a>
					<br />
					<a href="http://instagram.com">
						<span class="arrow">></span>
						<span class="text">insta</span>
					</a>
				</div>
			</div>
			{#if weather}
				<div id="weather-container" on:click={updateWeather}>
					<div id="temperature">{temperature}°</div>
					<div class="weather-icon {weatherClass}" />
					<!-- <div id="description">{description}</div> -->
				</div>
			{/if}
		</div>
	</div>
	<div id="version">v1.2.2</div>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}
	#box {
		display: flex;
		animation: appear 0.3s ease-out forwards;
		height: 27.5rem;
	}
	#image-container {
		width: 27rem;
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
		width: 3rem;
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
	#inner-box {
		width: 100%;
		padding: 3rem;
		background: var(--bg2-color);
		border-radius: 2rem;
	}
	h1 {
		margin: 0 0 2rem 0;
		font-weight: inherit;
		font-size: 2rem;
		opacity: 0;
		animation: text-appear 0.3s ease-out 0.2s forwards;
	}
	h2 {
		margin: 0 0 3.5rem 0;
		font-weight: inherit;
		font-size: 1.5rem;
		opacity: 0;
		animation: text-appear 0.3s ease-out 0.225s forwards;
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
	a:hover {
		color: var(--text-color);
	}
	a:hover .arrow {
		transform: none;
		opacity: 1;
	}
	a:hover .text {
		transform: none;
	}
	a:active:hover {
		transform: scale(0.9);
	}
	#weather-container {
		position: absolute;
		top: 0;
		right: 0;
		margin: 3rem 3rem;
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
	#version {
		position: absolute;
		margin: 1rem;
		bottom: 0;
		right: 0;
		color: var(--text-dark-color);
	}
</style>
