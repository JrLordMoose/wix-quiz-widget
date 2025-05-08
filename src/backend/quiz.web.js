import wixData from 'wix-data';

export async function saveQuizProgress(userId, quizId, progress) {
    try {
        const collection = await wixData.getCollection('QuizProgress');
        const existingProgress = await collection.query()
            .eq('userId', userId)
            .eq('quizId', quizId)
            .find();

        if (existingProgress.items.length > 0) {
            return await collection.update({
                _id: existingProgress.items[0]._id,
                progress: progress,
                lastUpdated: new Date()
            });
        } else {
            return await collection.insert({
                userId: userId,
                quizId: quizId,
                progress: progress,
                created: new Date(),
                lastUpdated: new Date()
            });
        }
    } catch (error) {
        console.error('Error saving quiz progress:', error);
        throw error;
    }
}

export async function getQuizProgress(userId, quizId) {
    try {
        const collection = await wixData.getCollection('QuizProgress');
        const result = await collection.query()
            .eq('userId', userId)
            .eq('quizId', quizId)
            .find();
        
        return result.items[0]?.progress || null;
    } catch (error) {
        console.error('Error getting quiz progress:', error);
        throw error;
    }
}

export async function submitQuizResults(userId, quizId, results) {
    try {
        const collection = await wixData.getCollection('QuizResults');
        return await collection.insert({
            userId: userId,
            quizId: quizId,
            results: results,
            submitted: new Date()
        });
    } catch (error) {
        console.error('Error submitting quiz results:', error);
        throw error;
    }
} 