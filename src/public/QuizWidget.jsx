import React, { useState, useEffect } from 'react';
import wixWidget from 'wix-widget';

const QuizWidget = () => {
  const [props, setProps] = useState({
    primaryColor: '#5e4b8b',
    quizTitle: 'Discover Your Type!',
    showEmailField: true,
    questions: [],
    products: []
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    wixWidget.getProps().then(setProps);
  }, []);

  const handleAnswer = (answer) => {
    setAnswers([...answers, answer]);
    if (currentStep < props.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    // Simple personality type calculation based on answers
    const personalityTypes = {
      'Explorer': 0,
      'Connector': 0,
      'Achiever': 0,
      'Innovator': 0
    };

    answers.forEach((answer, index) => {
      const question = props.questions[index];
      const type = question.options[answer].type;
      personalityTypes[type]++;
    });

    const dominantType = Object.entries(personalityTypes)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    setResult(dominantType);
  };

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await wixWidget.backend.storeLead({
        email,
        personalityType: result,
        quizAnswers: answers,
        quizVersion: '1.0',
        sourceSiteId: props.sourceSiteId,
        createdAt: new Date(),
        submitted: true
      });
      setError(null);
    } catch (err) {
      setError('Failed to submit. Please try again.');
      console.error('Error storing lead:', err);
    }
  };

  const renderQuestion = () => {
    if (!props.questions[currentStep]) return null;
    const question = props.questions[currentStep];

    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ color: props.primaryColor }}>{question.text}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              style={{
                padding: '10px',
                border: `2px solid ${props.primaryColor}`,
                borderRadius: '5px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const recommendedProducts = props.products.filter(p => 
      p.tags.includes(result)
    );

    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: props.primaryColor }}>Your Type: {result}</h2>
        <div>
          <h3>Recommended Products:</h3>
          {recommendedProducts.map((product, index) => (
            <div key={index} style={{ margin: '10px 0' }}>
              <h4>{product.title}</h4>
              <p>{product.description}</p>
            </div>
          ))}
        </div>
        {props.showEmailField && (
          <div style={{ marginTop: '20px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for results"
              style={{
                padding: '10px',
                width: '100%',
                marginBottom: '10px'
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 20px',
                background: props.primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Get Results
            </button>
            {error && (
              <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: props.primaryColor }}>
        {props.quizTitle}
      </h2>
      {!result ? renderQuestion() : renderResult()}
    </div>
  );
};

export default QuizWidget; 