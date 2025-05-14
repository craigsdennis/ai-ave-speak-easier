import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { ElevenLabsClient } from "elevenlabs";


const app = new Hono<{ Bindings: Env }>();

app.post('/api/upload', async(c) => {
	// Parse the uploaded audio file
	const body = await c.req.parseBody();
	const audio = body["audio"];
	const sourceLang = (body["source_lang"] as string) || "en";
	const targetLang = (body["target_lang"] as string) || "es";

	// Create ElevenLabs client
	const client = new ElevenLabsClient({ apiKey: c.env.ELEVENLABS_API_KEY });

	// Start the dubbing process
	const response = await client.dubbing.dubAVideoOrAnAudioFile({
		file: audio,
		source_lang: sourceLang,
		target_lang: targetLang,
	});

	return c.json(response);
});

app.get("/api/translations/:id/status", async(c) => {
	const dubbingId = c.req.param("id");
	const client = new ElevenLabsClient({ apiKey: c.env.ELEVENLABS_API_KEY });
	const metadata = await client.dubbing.getDubbingProjectMetadata(dubbingId);
	return c.json(metadata);
});


app.get("/api/translations/:id/audio", async(c) => {
	const dubbingId = c.req.param("id");
	const targetLang = c.req.query("target_lang") || "es";

	try {
		// Create the ElevenLabs client
		const client = new ElevenLabsClient({ apiKey: c.env.ELEVENLABS_API_KEY });

		// Get the audio stream from ElevenLabs
		const audioStream = await client.dubbing.getDubbedFile(dubbingId, targetLang);
		
		return stream(c, async(stream) => {
			for await (const chunk of audioStream) {
				stream.write(chunk);
			}
		});
	} catch (error) {
		console.error("Error fetching dubbed audio:", error);
		return c.json({
			status: "error",
			message: error || "Failed to fetch audio translation",
		}, 500);
	}
})

export default app;
