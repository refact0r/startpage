<script>
	export let name;
	export let apiKey;
	export let location;

	console.log(apiKey);

	let d = new Date();
	$: hours = format_two_digits(d.getHours() % 12 === 0 ? 12 : d.getHours() % 12);
	$: minutes = format_two_digits(d.getMinutes());
	$: date = d.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	$: greeting = d.getHours() < 12 ? 'morning' : d.getHours() < 18 ? 'afternoon' : 'evening';

	let version;
	fetch(`manifest.json`)
	.then(res => res.json())
	.then((out) => {
		version = out.version;
		console.log(out);
	});

	let weather;
	let weatherClass = "none";
	let temperature = 0;
	updateWeather();

	function updateWeather() {
		if (apiKey && location) {
			fetch(`http://api.openweathermap.org/data/2.5/weather?q=${location}&units=imperial&appid=${apiKey}`)
				.then(res => res.json())
				.then((out) => {
					weather = out;
					console.log(weather);
					temperature = Math.round(weather.main.temp);
					if (weather.weather[0].main === "Clear") {
						if (d < weather.sys.sunrise || d > weather.sys.sunset) {
							weatherClass = "moon";
						} else {
							weatherClass = "sun";
						}
					} else if (weather.weather[0].main === "Rain" || weather.weather[0].main === "Drizzle" || weather.weather[0].main === "Thunderstorm") {
						weatherClass = "rain";
					} else if (weather.weather[0].main === "Snow") {
						weatherClass = "snow";
					} else {
						weatherClass = "cloud";
					}
				}).catch((error) => {
					console.log(error);
					weather = null;
				});
		}
	}

	const timeInterval = setInterval(() => {
		d = new Date();
	}, 1000);

	const weatherInterval = setInterval(() => {
		updateWeather();
	}, 600000);

	function format_two_digits(n) {
		return n < 10 ? '0' + n : n;
	}
</script>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: inherit;
	}
	#box {
		display: flex;
		width: 70rem;
		height: 32rem;
		margin: auto;
		background: var(--bg2-color);
		border-radius: 1rem;
		box-shadow: 0 0.5rem 1rem #00000050;
		animation: appear 0.4s ease-out forwards;
	}
	#image-container {
		display: inline-block;
		position: relative;
		height: inherit;
		margin: 0;
	}
	#image {
		height: inherit;
		border-radius: 1rem 0 0rem 1rem;
		filter: brightness(0.8);
	}
	#time {
		position: absolute;
		width: 3.5rem;
		top: 50%;
		left: 50%;
    	transform: translate(-50%, -50%) scale(0%);
		padding: 1rem;
		overflow-wrap: break-word;
		text-align: center;
		font-size: 3.5rem;
		background: #00000050;
		color: var(--text-light-color);
		border-radius: 1rem;
		mix-blend-mode: overlay;
		animation: time-appear 0.4s ease-out 0.2s forwards;
	}
	#inner-box {
		width: 100%;
		padding: 4rem;
	}
	h1 {
		margin: 0;
		font-weight: inherit;
		font-size: 2rem;
        opacity: 0;
		animation: text-appear 0.4s ease-out 0.2s forwards;
	}
	h2 {
		margin: 0;
		font-weight: inherit;
		font-size: 1.5rem;
        opacity: 0;
		animation: text-appear 0.4s ease-out 0.25s forwards;
	}
	#links {
		display: flex;
		justify-content: space-between;
		margin: 0;
	}
	.link-column {
		width: 7.5rem;
		opacity: 0;
	}
	#link-column-1 {
		animation: text-appear 0.4s ease-out 0.3s forwards;
	}
	#link-column-2 {
		animation: text-appear 0.4s ease-out 0.35s forwards;
	}
	#link-column-3 {
		animation: text-appear 0.4s ease-out 0.4s forwards;
	}
	a {
		display: inline-block;
		text-decoration: none;
    	color: var(--text-dark-color);
		transition: 0.3s ease;
	}
	.arrow {
    	display: inline-block;
		transform: translate(-22px);
		opacity: 0;
		transition: 0.3s ease;
	}
	.text {
    	display: inline-block;
		transform: translate(-22px);
		transition: 0.3s ease;
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
	br {
		line-height: 2rem;
	}
	#weather-container {
		position: absolute;
		top: 0;
		right: 0;
		margin: 4rem 5rem;
		opacity: 0;
		animation: weather-appear 0.4s ease-out 0.4s forwards;
	}
	#temperature {
		display: inline-block;
		margin: 0.3rem 0.2rem 0 0;
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

<main>
	<div id="box">
		<div id="image-container">
			<img id="image" src="gifs/bg-1.gif" alt="">
			<div id="time">{hours}-{minutes}</div>
		</div>
		<div id="inner-box">
			{#if name}
				<h1 id="header-1">Good {greeting}, {name}.</h1>
			{:else}
				<h1 id="header-1">Good {greeting}.</h1>
			{/if}
			<br>
			<h2 id="header-2">Today is {date}.</h2>
			<br><br>
			<div id="links">
				<div class="link-column" id="link-column-1">
					<a href="https://mail.google.com">
						<span class="arrow">></span> <span class="text">gmail</span>
					</a>
					<br><br>
					<a href="https://calendar.google.com">
						<span class="arrow">></span> <span class="text">calendar</span>
					</a>
					<br><br>
					<a href="https://drive.google.com">
						<span class="arrow">></span> <span class="text">drive</span>
					</a>
					<br><br>
					<a href="https://docs.google.com">
						<span class="arrow">></span> <span class="text">docs</span>
					</a>
				</div>
				<div class="link-column" id="link-column-2">
					<a href="https://github.com">
						<span class="arrow">></span> <span class="text">github</span>
					</a>
					<br><br>
					<a href="https://stackoverflow.com">
						<span class="arrow">></span> <span class="text">stack</span>
					</a>
					<br><br>
					<a href="https://dashboard.heroku.com">
						<span class="arrow">></span> <span class="text">heroku</span>
					</a>
					<br><br>
					<a href="https://wa-bsd405-psv.edupoint.com/Home_PXP2.aspx">
						<span class="arrow">></span> <span class="text">synergy</span>
					</a>
				</div>
				<div class="link-column" id="link-column-3">
					<a href="https://youtube.com">
						<span class="arrow">></span> <span class="text">youtube</span>
					</a>
					<br><br>
					<a href="https://twitch.tv">
						<span class="arrow">></span> <span class="text">twitch</span>
					</a>
					<br><br>
					<a href="https://reddit.com">
						<span class="arrow">></span> <span class="text">reddit</span>
					</a>
					<br><br>
					<a href="http://monkeytype.com">
						<span class="arrow">></span> <span class="text">type</span>
					</a>
				</div>
			</div>
			{#if weather}
				<div id="weather-container">
					<div id="temperature">{temperature}°</div>
					<div class="weather-icon {weatherClass}"></div>
				</div>
			{/if}
		</div>
	</div>
	<div id="version">v{version}</div>
</main>