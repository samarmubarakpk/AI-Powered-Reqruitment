// src/components/company/InterviewRoom.js
import React, { useState, useEffect } from 'react';
import { CallClient, CallAgent, DeviceManager, LocalVideoStream } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

function InterviewRoom({ interviewId, candidateName, questions }) {
  const [callAgent, setCallAgent] = useState(null);
  const [call, setCall] = useState(null);
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [deviceManager, setDeviceManager] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Initialize call client with token from backend
  useEffect(() => {
    async function initialize() {
      const response = await fetch(`/api/interviews/${interviewId}/token`);
      const { token } = await response.json();
      
      const tokenCredential = new AzureCommunicationTokenCredential(token);
      const callClient = new CallClient();
      const callAgentClient = await callClient.createCallAgent(tokenCredential);
      const devices = await callClient.getDeviceManager();
      
      setCallAgent(callAgentClient);
      setDeviceManager(devices);
    }
    
    initialize();
  }, [interviewId]);

  // Start video call
  const startInterview = async () => {
    // Get candidate's communication ID from backend
    const response = await fetch(`/api/interviews/${interviewId}/candidate-id`);
    const { communicationUserId } = await response.json();
    
    // Start camera
    const cameras = await deviceManager.getCameras();
    const localVideo = new LocalVideoStream(cameras[0]);
    setLocalVideoStream(localVideo);
    
    // Start call
    const callOptions = { videoOptions: { localVideoStreams: [localVideo] } };
    const newCall = callAgent.startCall([{ communicationUserId }], callOptions);
    setCall(newCall);
  };

  // Display the current question
  const displayCurrentQuestion = () => {
    if (!questions || questions.length === 0) return <p>No questions available</p>;
    if (currentQuestionIndex >= questions.length) return <p>Interview completed</p>;
    
    const question = questions[currentQuestionIndex];
    return (
      <div className="p-4 bg-indigo-50 rounded-lg">
        <p className="font-medium">{question.question}</p>
        <p className="text-sm text-gray-500 mt-2">{question.explanation}</p>
      </div>
    );
  };

  // Go to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // End the interview
  const endInterview = async () => {
    if (call) {
      call.hangUp();
      setCall(null);
    }
    
    // Send interview completion to backend
    await fetch(`/api/interviews/${interviewId}/complete`, {
      method: 'POST'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Interview with {candidateName}</h2>
        
        {/* Video container */}
        <div className="bg-gray-800 aspect-video rounded-lg mb-4">
          {/* Video stream would go here */}
        </div>
        
        <div className="flex justify-between">
          {!call ? (
            <button
              onClick={startInterview}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Start Interview
            </button>
          ) : (
            <button
              onClick={endInterview}
              className="px-4 py-2 bg-red-600 text-white rounded-md"
            >
              End Interview
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Interview Questions</h2>
        
        {displayCurrentQuestion()}
        
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          <button
            onClick={nextQuestion}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewRoom;