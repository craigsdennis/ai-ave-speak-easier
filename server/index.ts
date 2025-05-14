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

// Download endpoint specifically for handling MP3 downloads with proper headers
app.get("/api/translations/:id/download", async(c) => {
	const dubbingId = c.req.param("id");
	const targetLang = c.req.query("target_lang") || "es";

	try {
		// Create the ElevenLabs client
		const client = new ElevenLabsClient({ apiKey: c.env.ELEVENLABS_API_KEY });

		// Get the audio stream from ElevenLabs
		const audioStream = await client.dubbing.getDubbedFile(dubbingId, targetLang);
		
		// Set appropriate Content-Type and Content-Disposition headers for download
		// Using audio/mp3 instead of audio/mpeg to be more specific
		c.header('Content-Type', 'audio/mp3');
		c.header('Content-Disposition', `attachment; filename="translated_audio_${targetLang}.mp3"`);
		// Add cache control headers to prevent caching issues
		c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
		c.header('Pragma', 'no-cache');
		c.header('Expires', '0');
		
		return stream(c, async(stream) => {
			for await (const chunk of audioStream) {
				stream.write(chunk);
			}
		});
	} catch (error) {
		console.error("Error downloading dubbed audio:", error);
		return c.json({
			status: "error",
			message: error || "Failed to download audio translation",
		}, 500);
	}
})

// Get transcript for dubbed audio
app.get("/api/translations/:id/transcript", async(c) => {
	const dubbingId = c.req.param("id");
	const language = c.req.query("language") || "target"; // 'source' or 'target'
	const targetLang = c.req.query("target_lang") || "es";
	const sourceLang = c.req.query("source_lang") || "en";
	const formatType = c.req.query("format") || "srt"; // 'srt' or 'webvtt'
	
	try {
		// Create the ElevenLabs client
		const client = new ElevenLabsClient({ apiKey: c.env.ELEVENLABS_API_KEY });
		
		// Determine which language code to use
		const langCode = language === "source" ? sourceLang : targetLang;
		
		// Get the transcript from ElevenLabs using the client method
		const transcript = await client.dubbing.getTranscriptForDub(dubbingId, langCode, formatType as "srt" | "webvtt");
		
		// Return the transcript text
		c.header('Content-Type', 'text/plain');
		return c.body(transcript);
	} catch (error) {
		console.error("Error fetching transcript:", error);
		return c.json({
			status: "error",
			message: error.message || "Failed to fetch transcript",
		}, 500);
	}
})

export default app;
