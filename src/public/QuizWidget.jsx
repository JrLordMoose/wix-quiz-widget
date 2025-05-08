import React, { useState, useEffect } from 'react';
import { saveQuizProgress, getQuizProgress, submitQuizResults } from 'backend/quiz';
import wixWidget from 'wix-widget';

const QuizWidget = ({ quizId, title, questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [props, setProps] = useState({
    primaryColor: '#5e4b8b',
    quizTitle: 'Discover Your Type!',
    showEmailField: true,
    allowSkip: false,
    language: 'en',
    translations: {},
    products: [],
    adminExport: false
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [lastStep, setLastStep] = useState(0);

  // Analytics/Event helpers
  const fireEvent = (eventName, eventData = {}) => {
    try {
      // Google Analytics (gtag)
      if (window.gtag) {
        window.gtag('event', eventName, eventData);
        console.log('GA event fired:', eventName, eventData);
      }
      // Facebook Pixel (fbq)
      if (window.fbq) {
        window.fbq('trackCustom', eventName, eventData);
        console.log('FB Pixel event fired:', eventName, eventData);
      }
      // Custom event (for other integrations)
      window.dispatchEvent(new CustomEvent(`quiz-${eventName}`, { detail: eventData }));
      console.log('Custom event fired:', `quiz-${eventName}`, eventData);
    } catch (err) {
      console.error('Error firing analytics event:', eventName, err);
    }
  };

  useEffect(() => {
    // Get current user ID
    wixUsers.currentUser.getLoggedInUser()
      .then(user => {
        setUserId(user.id);
        return getQuizProgress(user.id, quizId);
      })
      .then(savedProgress => {
        if (savedProgress) {
          setAnswers(savedProgress.answers);
          setCurrentQuestion(savedProgress.currentQuestion);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading quiz progress:', error);
        setIsLoading(false);
      });
  }, [quizId]);

  useEffect(() => {
    wixWidget.getProps().then(async (propsData) => {
      setProps(propsData);
      if (propsData.quizVersion) {
        try {
          const quiz = await wixWidget.backend.getQuizVersion(propsData.quizVersion);
          if (quiz) {
            setProps(prev => ({
              ...prev,
              quizTitle: quiz.title || prev.quizTitle,
              questions: quiz.questions || prev.questions
            }));
            console.log('Loaded quiz version:', propsData.quizVersion, quiz);
          }
        } catch (err) {
          console.error('Error loading quiz version:', err);
        }
      }
    });
  }, []);

  useEffect(() => {
    fireEvent('quiz_start', { quizTitle: props.quizTitle });
  }, [props.quizTitle]);

  const handleAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    try {
      await saveQuizProgress(userId, quizId, {
        currentQuestion,
        answers: newAnswers
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitQuizResults(userId, quizId, {
        answers,
        completedAt: new Date()
      });
      // Handle quiz completion
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const calculateResult = async (answersArr = answers) => {
    // Simple personality type calculation based on answers
    const personalityTypes = {
      'Explorer': 0,
      'Connector': 0,
      'Achiever': 0,
      'Innovator': 0
    };

    answersArr.forEach((answer, index) => {
      if (answer === null) return; // Ignore skipped questions
      const question = props.questions[index];
      const type = question.options[answer].type;
      personalityTypes[type]++;
    });

    const dominantType = Object.entries(personalityTypes)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    setResult(dominantType);
    fireEvent('quiz_completed', {
      quizTitle: props.quizTitle,
      result: dominantType,
      answers: answersArr
    });
    setLoadingProducts(true);
    try {
      const res = await wixWidget.backend.getProductsByTag(dominantType);
      setRecommendedProducts(res.items || []);
      setLoadingProducts(false);
    } catch (err) {
      setError('Failed to fetch products.');
      setLoadingProducts(false);
    }
  };

  if (isLoading) {
    return <div>Loading quiz...</div>;
  }

  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-start bg-gray-100 py-4 sm:py-10 px-2">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8" style={{ color: props.primaryColor }}>
        {props.quizTitle}
      </h2>
      {props.adminExport && (
        <button
          onClick={() => {
            // Implement CSV export functionality
          }}
          className="mb-4 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors duration-200 text-sm sm:text-base"
        >
          Export Leads to CSV
        </button>
      )}
      <div className="w-full max-w-xl sm:max-w-2xl bg-white rounded-lg shadow-lg">
        {currentQuestion < props.questions.length ? (
          <div className="question-container">
            <h3>{props.questions[currentQuestion].text}</h3>
            <div className="answers">
              {props.questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(props.questions[currentQuestion].id, option)}
                  className={answers[props.questions[currentQuestion].id] === option ? 'selected' : ''}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="navigation">
              <button
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                disabled={currentQuestion === 0}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={currentQuestion === props.questions.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="completion">
            <h3>Quiz Complete!</h3>
            <button onClick={handleSubmit}>Submit Results</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizWidget; 