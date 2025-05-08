import wixData from 'wix-data';

export function quizProgress_onBeforeInsert(item) {
    item.created = new Date();
    item.lastUpdated = new Date();
    return item;
}

export function quizProgress_onBeforeUpdate(item) {
    item.lastUpdated = new Date();
    return item;
}

export function quizResults_onBeforeInsert(item) {
    item.submitted = new Date();
    return item;
}

export function quizResults_onBeforeUpdate(item) {
    item.lastUpdated = new Date();
    return item;
} 