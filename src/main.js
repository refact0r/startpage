import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		// CHANGE THESE VARIABLES
		name: '',
		location: '',
		apiKey: ''
	}
});

export default app;