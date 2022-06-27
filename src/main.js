import App from './App.svelte'
import { writable } from 'svelte/store'

const defaultConfig = {
	name: 'refactor',
	location: 'Seattle',
	units: 'imperial',
	apiKey: '',
	links: [
		[
			{ name: 'gmail', url: 'https://mail.google.com' },
			{ name: 'calendar', url: 'https://calendar.google.com' },
			{ name: 'drive', url: 'https://drive.google.com' },
			{ name: 'docs', url: 'https://docs.google.com' },
		],
		[
			{ name: 'github', url: 'https://github.com' },
			{ name: 'translate', url: 'https://translate.google.com' },
			{ name: 'finance', url: 'https://finance.yahoo.com' },
			{ name: 'type', url: 'https://monkeytype.com' },
		],
		[
			{ name: 'youtube', url: 'https://youtube.com' },
			{ name: 'twitch', url: 'https://twitch.tv' },
			{ name: 'reddit', url: 'https://reddit.com' },
			{ name: 'insta', url: 'http://instagram.com' },
		],
	],
}
const storedConfig = JSON.parse(localStorage.getItem('config')) ?? defaultConfig
const config = writable(storedConfig)
config.subscribe((value) => {
	localStorage.setItem('config', JSON.stringify(value))
})

const app = new App({
	target: document.body,
	props: {
		config: config,
	},
})

export default app
