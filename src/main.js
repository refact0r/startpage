import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'Yifan',
		location: 'bellevue'
	}
});

export default app;