import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

export const VoiceRecorder = ({ onRecordingComplete }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Could not access microphone');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    chunksRef.current = [];
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording && !audioURL && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
        >
          <Mic className="h-4 w-4 mr-2" />
          Record Voice Note
        </Button>
      )}
      
      {isRecording && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={stopRecording}
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Recording
        </Button>
      )}
      
      {audioURL && (
        <div className="flex items-center space-x-2">
          <audio src={audioURL} controls className="h-8" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={deleteRecording}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
