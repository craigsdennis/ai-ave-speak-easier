This backend wraps ElevenLabs dubbing api. The front-end is a new Vue app. The idea is that one person will record some audio and it will
translate to the other language. I think we should have an application that is split one language on one side and one on the 
  other. The result returns `expected_duration_sec` which can be used. 
   We should start polling after that expected duration and show the 
  status. When the dubbing is complete stream the audio using the API.




Okay I'd love to get the transcript for the recordings after it's dubbed to go in the conversation history. Here is the API I'd like to wrap from ElevenLabs: https://elevenlabs.io/docs/api-reference/dubbing/get-transcript-for-dub 