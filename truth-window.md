This backend wraps ElevenLabs dubbing api. The front-end is a new Vue app. The idea is that one person will record some audio and it will
translate to the other language. I think we should have an application that is split one language on one side and one on the 
  other. The result returns `expected_duration_sec` which can be used. 
   We should start polling after that expected duration and show the 
  status. When the dubbing is complete stream the audio using the API.

 This is the list of supported languages https://elevenlabs.io/docs/capabilities/dubbing#list-of-supported-languages-for-dubbing                    │

Okay, so now, after the dub is playable, I want to continue the conversation. So we'd keep the existing setup but then add a new component that    │
│   does the translation the other direction. The idea here is that people are going to have a conversation in their native language. I suppose add    │
│   it beneath and scroll. I also want to be able to use this app on a phone as well. 


Okay I'd love to get the transcript for the recordings after it's dubbed to go in the conversation history. Here is the API I'd like to wrap from ElevenLabs: https://elevenlabs.io/docs/api-reference/dubbing/get-transcript-for-dub 