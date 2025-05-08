import React, { useState, useEffect } from 'react';
import wixWidget from 'wix-widget';

const QuizWidget = () => {
  const [props, setProps] = useState({
    primaryColor: '#5e4b8b',
    quizTitle: 'Discover Your Type!',
    showEmailField: true,
    allowSkip: false,
    language: 'en',
    translations: {},
    questions: [],
    products: [],
    adminExport: false
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [email, setEmail] = useState('');
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

  const handleAnswer = async (answer) => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    setLastStep(currentStep);
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    fireEvent('question_answered', {
      questionIndex: currentStep,
      answer,
      quizTitle: props.quizTitle
    });
    try {
      await wixWidget.backend.savePartialLead({
        email,
        quizAnswers: newAnswers,
        quizVersion: '1.0',
        sourceSiteId: props.sourceSiteId
      });
      console.log('Partial lead saved after answer:', newAnswers);
    } catch (err) {
      console.error('Error saving partial lead:', err);
    }
    if (currentStep < props.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const handleSkip = async () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    setLastStep(currentStep);
    if (!props.allowSkip) {
      console.warn('Skip not allowed.');
      return;
    }
    const newAnswers = [...answers, null];
    setAnswers(newAnswers);
    fireEvent('question_skipped', {
      questionIndex: currentStep,
      quizTitle: props.quizTitle
    });
    try {
      await wixWidget.backend.savePartialLead({
        email,
        quizAnswers: newAnswers,
        quizVersion: '1.0',
        sourceSiteId: props.sourceSiteId
      });
      console.log('Partial lead saved after skip:', newAnswers);
    } catch (err) {
      console.error('Error saving partial lead (skip):', err);
    }
    if (currentStep < props.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(newAnswers);
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
      fireEvent('lead_submitted', {
        email,
        result,
        quizTitle: props.quizTitle
      });
    } catch (err) {
      setError('Failed to submit. Please try again.');
      console.error('Error storing lead:', err);
    }
  };

  // Admin CSV export (for demo, show if props.adminExport is true)
  const handleExportCSV = async () => {
    try {
      const csv = await wixWidget.backend.exportLeadsToCSV();
      if (!csv) {
        alert('No leads to export.');
        return;
      }
      // Create a blob and trigger download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Leads CSV download triggered.');
    } catch (err) {
      alert('Failed to export leads.');
      console.error('Error exporting leads to CSV:', err);
    }
  };

  const renderQuestion = () => {
    if (!props.questions[currentStep]) return null;
    const question = props.questions[currentStep];

    return (
      <div
        key={currentStep}
        className={`p-6 max-w-xl mx-auto transition-all duration-300 ease-in-out transform ${animating ? (currentStep > lastStep ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8') : 'opacity-100 translate-x-0'} bg-white rounded-lg shadow-md sm:p-8 sm:max-w-2xl`}
      >
        <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: props.primaryColor }}>
          {t(`question_${currentStep}`, question.text)}
        </h3>
        <div className="flex flex-col gap-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="py-2 px-3 sm:px-4 border-2 rounded-md bg-white transition-colors duration-200 hover:bg-gray-50 focus:outline-none text-sm sm:text-base"
              style={{ borderColor: props.primaryColor, color: props.primaryColor }}
            >
              {t(`question_${currentStep}_option_${index}`, option.text)}
            </button>
          ))}
          {props.allowSkip && (
            <button
              onClick={handleSkip}
              className="py-2 px-3 sm:px-4 border-2 border-dashed rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors duration-200 mt-2 text-sm sm:text-base"
            >
              {t('skip', 'Skip')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    const total = props.questions.length;
    const progress = total > 0 ? ((currentStep + 1) / total) * 100 : 0;
    return (
      <div className="w-full h-3 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    if (loadingProducts) {
      return <div className="p-6 max-w-xl mx-auto text-center text-lg text-gray-500">{t('loadingProducts', 'Loading recommended products...')}</div>;
    }

    return (
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-4" style={{ color: props.primaryColor }}>{t('yourType', 'Your Type')}: {result}</h2>
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('recommendedProducts', 'Recommended Products')}:</h3>
          {recommendedProducts.length > 0 ? (
            recommendedProducts.map((product, index) => (
              <div key={index} className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-bold text-gray-800">{product.title}</h4>
                <p className="text-gray-600">{product.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">{t('noProductsFound', 'No products found for this type.')}</p>
          )}
        </div>
        {props.showEmailField && (
          <div className="mt-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder', 'Enter your email for results')}
              className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button
              onClick={handleSubmit}
              className="w-full py-2 px-4 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow hover:from-purple-700 hover:to-indigo-700 transition-colors duration-200"
              style={{ background: props.primaryColor }}
            >
              {t('getResults', 'Get Results')}
            </button>
            {error && (
              <p className="text-red-600 mt-2 text-sm">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const t = (key, fallback) => {
    return (
      (props.translations?.[props.language]?.[key]) ||
      (props.translations?.en?.[key]) ||
      fallback || key
    );
  };

  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-start bg-gray-100 py-4 sm:py-10 px-2">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8" style={{ color: props.primaryColor }}>
        {t('quizTitle', props.quizTitle)}
      </h2>
      {props.adminExport && (
        <button
          onClick={handleExportCSV}
          className="mb-4 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors duration-200 text-sm sm:text-base"
        >
          {t('exportLeads', 'Export Leads to CSV')}
        </button>
      )}
      <div className="w-full max-w-xl sm:max-w-2xl bg-white rounded-lg shadow-lg">
        {!result && renderProgressBar()}
        {!result ? renderQuestion() : renderResult()}
      </div>
    </div>
  );
};

export default QuizWidget; 