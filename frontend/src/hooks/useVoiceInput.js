import { useState, useRef, useCallback } from "react";

export function useVoiceInput(onResult, lang = "ar-LB", continuous = false) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef  = useRef("");

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!supported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = continuous;
    recognition.maxAlternatives = 1;
    recognition.continuous = continuous;

    transcriptRef.current = "";

    recognition.onstart = () => setListening(true);
    recognition.onend   = () => {
      setListening(false);
      // For continuous mode, fire onResult with the full accumulated transcript on end
      if (continuous && transcriptRef.current.trim() && onResult) {
        onResult(transcriptRef.current.trim());
      }
    };
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      if (continuous) {
        // Accumulate all final results
        let finalText = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + " ";
          }
        }
        transcriptRef.current = finalText.trim();
        // Stream interim result so the textarea updates in real-time
        if (onResult) onResult(transcriptRef.current || event.results[event.results.length - 1][0].transcript);
      } else {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [supported, onResult, lang, continuous]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // onend will fire and handle the final result for continuous mode
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  return { listening, startListening, stopListening, toggle, supported };
}