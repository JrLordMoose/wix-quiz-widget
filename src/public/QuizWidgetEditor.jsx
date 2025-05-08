import React from 'react';

const QuizWidgetEditor = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Quiz Widget Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Quiz Title</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter quiz title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Enter quiz description"
          />
        </div>
      </div>
    </div>
  );
};

export default QuizWidgetEditor; 