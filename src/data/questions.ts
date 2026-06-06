export interface Question {
  id: string;
  type: 'attack' | 'defense';
  grade: '1-2' | '3-4';
  question: string;
  answer: string;
  distractors: string[]; // Must contain at least 4 distractors
}

export const DEFAULT_QUESTIONS: Question[] = [
  // ===== GRADE 1-2 ATTACK (VOCABULARY) =====
  {
    id: 'g12_att_1',
    type: 'attack',
    grade: '1-2',
    question: 'The cute ________ is barking at the cat.',
    answer: 'dog',
    distractors: ['bird', 'fish', 'monkey', 'banana']
  },
  {
    id: 'g12_att_2',
    type: 'attack',
    grade: '1-2',
    question: 'I draw a picture with a blue ________.',
    answer: 'crayon',
    distractors: ['spoon', 'cookie', 'frog', 'cloud']
  },
  {
    id: 'g12_att_3',
    type: 'attack',
    grade: '1-2',
    question: 'My mother is cooking dinner in the ________.',
    answer: 'kitchen',
    distractors: ['bedroom', 'garden', 'park', 'bathroom']
  },
  {
    id: 'g12_att_4',
    type: 'attack',
    grade: '1-2',
    question: 'The sun is yellow and very ________.',
    answer: 'hot',
    distractors: ['cold', 'blue', 'sad', 'small']
  },
  {
    id: 'g12_att_5',
    type: 'attack',
    grade: '1-2',
    question: 'I have five ________ on my hand.',
    answer: 'fingers',
    distractors: ['toes', 'ears', 'noses', 'eyes']
  },
  {
    id: 'g12_att_6',
    type: 'attack',
    grade: '1-2',
    question: 'An elephant is very ________, but a mouse is small.',
    answer: 'big',
    distractors: ['tiny', 'blue', 'fast', 'weak']
  },
  {
    id: 'g12_att_7',
    type: 'attack',
    grade: '1-2',
    question: 'The sky is ________ and the grass is green.',
    answer: 'blue',
    distractors: ['pink', 'purple', 'black', 'orange']
  },
  {
    id: 'g12_att_8',
    type: 'attack',
    grade: '1-2',
    question: 'We see a cute ________ hopping in the grass.',
    answer: 'rabbit',
    distractors: ['snake', 'monkey', 'lion', 'bear']
  },
  {
    id: 'g12_att_9',
    type: 'attack',
    grade: '1-2',
    question: 'I eat a sweet red ________ in the morning.',
    answer: 'apple',
    distractors: ['pencil', 'shoe', 'train', 'clock']
  },
  {
    id: 'g12_att_10',
    type: 'attack',
    grade: '1-2',
    question: 'Look! The big brown ________ is climbing the tree.',
    answer: 'bear',
    distractors: ['plane', 'crayon', 'water', 'book']
  },
  {
    id: 'g12_att_11',
    type: 'attack',
    grade: '1-2',
    question: 'The green ________ is jumping in the pond.',
    answer: 'frog',
    distractors: ['rabbit', 'cookie', 'shirt', 'desk']
  },
  {
    id: 'g12_att_12',
    type: 'attack',
    grade: '1-2',
    question: 'I have a white ________ under my head when I sleep.',
    answer: 'pillow',
    distractors: ['door', 'cup', 'spoon', 'sock']
  },
  {
    id: 'g12_att_13',
    type: 'attack',
    grade: '1-2',
    question: 'Please close the ________, it is very cold outside.',
    answer: 'window',
    distractors: ['floor', 'paper', 'grape', 'ball']
  },
  {
    id: 'g12_att_14',
    type: 'attack',
    grade: '1-2',
    question: 'The teacher writes on the ________ with white chalk.',
    answer: 'board',
    distractors: ['chair', 'kitchen', 'pencil', 'garden']
  },
  {
    id: 'g12_att_15',
    type: 'attack',
    grade: '1-2',
    question: 'I brush my ________ every morning and night.',
    answer: 'teeth',
    distractors: ['ears', 'nose', 'toes', 'hands']
  },
  {
    id: 'g12_att_16',
    type: 'attack',
    grade: '1-2',
    question: 'The fish lives in the blue ________.',
    answer: 'water',
    distractors: ['sky', 'tree', 'classroom', 'bed']
  },
  {
    id: 'g12_att_17',
    type: 'attack',
    grade: '1-2',
    question: 'A ________ says meow and loves to play with yarn.',
    answer: 'cat',
    distractors: ['dog', 'bird', 'sheep', 'lion']
  },
  {
    id: 'g12_att_18',
    type: 'attack',
    grade: '1-2',
    question: 'The ________ is yellow and gives us light in the day.',
    answer: 'sun',
    distractors: ['moon', 'star', 'cloud', 'rain']
  },

  // ===== GRADE 1-2 DEFENSE (GRAMMAR) =====
  {
    id: 'g12_def_1',
    type: 'defense',
    grade: '1-2',
    question: 'He ________ an apple every day.',
    answer: 'eats',
    distractors: ['eat', 'eating', 'ate', 'eaten']
  },
  {
    id: 'g12_def_2',
    type: 'defense',
    grade: '1-2',
    question: 'They ________ going to the park together.',
    answer: 'are',
    distractors: ['is', 'am', 'be', 'was']
  },
  {
    id: 'g12_def_3',
    type: 'defense',
    grade: '1-2',
    question: 'I ________ a student, and she is a teacher.',
    answer: 'am',
    distractors: ['is', 'are', 'be', 'were']
  },
  {
    id: 'g12_def_4',
    type: 'defense',
    grade: '1-2',
    question: 'She ________ two cute dogs at home.',
    answer: 'has',
    distractors: ['have', 'having', 'had', 'haves']
  },
  {
    id: 'g12_def_5',
    type: 'defense',
    grade: '1-2',
    question: 'Look! The baby is ________ in the bed.',
    answer: 'sleeping',
    distractors: ['sleep', 'sleeps', 'slept', 'sleeper']
  },
  {
    id: 'g12_def_6',
    type: 'defense',
    grade: '1-2',
    question: 'The pencil is ________ the desk. (在桌面上)',
    answer: 'on',
    distractors: ['in', 'under', 'at', 'into']
  },
  {
    id: 'g12_def_7',
    type: 'defense',
    grade: '1-2',
    question: 'She ________ school at 8 o\'clock.',
    answer: 'starts',
    distractors: ['start', 'starting', 'started', 'starter']
  },
  {
    id: 'g12_def_8',
    type: 'defense',
    grade: '1-2',
    question: 'Where ________ my yellow pencils?',
    answer: 'are',
    distractors: ['is', 'am', 'be', 'was']
  },
  {
    id: 'g12_def_9',
    type: 'defense',
    grade: '1-2',
    question: 'We ________ like to eat sour lemons.',
    answer: 'do not',
    distractors: ['does not', 'are not', 'is not', 'did not']
  },
  {
    id: 'g12_def_10',
    type: 'defense',
    grade: '1-2',
    question: 'This is ________ orange cat.',
    answer: 'an',
    distractors: ['a', 'the', 'some', 'many']
  },
  {
    id: 'g12_def_11',
    type: 'defense',
    grade: '1-2',
    question: 'There ________ a small bird on the roof.',
    answer: 'is',
    distractors: ['are', 'am', 'be', 'were']
  },
  {
    id: 'g12_def_12',
    type: 'defense',
    grade: '1-2',
    question: 'The book is ________ my backpack. (在背包裡面)',
    answer: 'in',
    distractors: ['on', 'at', 'under', 'over']
  },
  {
    id: 'g12_def_13',
    type: 'defense',
    grade: '1-2',
    question: 'I ________ run very fast because I am small.',
    answer: 'can',
    distractors: ['do', 'is', 'are', 'am']
  },
  {
    id: 'g12_def_14',
    type: 'defense',
    grade: '1-2',
    question: '________ you like sweet cookies?',
    answer: 'Do',
    distractors: ['Does', 'Is', 'Are', 'Am']
  },

  // ===== GRADE 3-4 ATTACK (VOCABULARY) =====
  {
    id: 'g34_att_1',
    type: 'attack',
    grade: '3-4',
    question: 'Yesterday, I went to the ________ to borrow a book.',
    answer: 'library',
    distractors: ['supermarket', 'bakery', 'hospital', 'zoo']
  },
  {
    id: 'g34_att_2',
    type: 'attack',
    grade: '3-4',
    question: 'The weather is ________ today, so we should bring an umbrella.',
    answer: 'rainy',
    distractors: ['sunny', 'hot', 'dry', 'windy']
  },
  {
    id: 'g34_att_3',
    type: 'attack',
    grade: '3-4',
    question: 'The doctor works in the ________ to help sick people.',
    answer: 'hospital',
    distractors: ['school', 'restaurant', 'airport', 'museum']
  },
  {
    id: 'g34_att_4',
    type: 'attack',
    grade: '3-4',
    question: 'A monkey is very ________ because it can learn tricks.',
    answer: 'clever',
    distractors: ['heavy', 'slow', 'cold', 'scared']
  },
  {
    id: 'g34_att_5',
    type: 'attack',
    grade: '3-4',
    question: 'Please wash your hands before having ________.',
    answer: 'dinner',
    distractors: ['homework', 'bedtime', 'shower', 'running']
  },
  {
    id: 'g34_att_6',
    type: 'attack',
    grade: '3-4',
    question: 'The train is much faster than the ________.',
    answer: 'bicycle',
    distractors: ['airplane', 'rocket', 'subway', 'helicopter']
  },
  {
    id: 'g34_att_7',
    type: 'attack',
    grade: '3-4',
    question: 'We visited the ________ to see lions and tigers.',
    answer: 'zoo',
    distractors: ['bakery', 'market', 'station', 'bank']
  },
  {
    id: 'g34_att_8',
    type: 'attack',
    grade: '3-4',
    question: 'He washes his dirty face in the ________.',
    answer: 'bathroom',
    distractors: ['classroom', 'library', 'office', 'dining room']
  },
  {
    id: 'g34_att_9',
    type: 'attack',
    grade: '3-4',
    question: 'The yellow ________ grows on a tree and tastes sour.',
    answer: 'lemon',
    distractors: ['tomato', 'cookie', 'meat', 'potato']
  },
  {
    id: 'g34_att_10',
    type: 'attack',
    grade: '3-4',
    question: 'The ________ drives the bus very carefully.',
    answer: 'driver',
    distractors: ['doctor', 'nurse', 'cook', 'farmer']
  },
  {
    id: 'g34_att_11',
    type: 'attack',
    grade: '3-4',
    question: 'I wear a warm ________ in cold winter days.',
    answer: 'jacket',
    distractors: ['skirt', 'shorts', 'swimsuit', 'glasses']
  },
  {
    id: 'g34_att_12',
    type: 'attack',
    grade: '3-4',
    question: 'We saw many colorful flowers in the public ________.',
    answer: 'park',
    distractors: ['airport', 'theater', 'factory', 'garage']
  },
  {
    id: 'g34_att_13',
    type: 'attack',
    grade: '3-4',
    question: 'My sister loves playing the ________ after school.',
    answer: 'piano',
    distractors: ['soccer', 'homework', 'chess', 'reading']
  },
  {
    id: 'g34_att_14',
    type: 'attack',
    grade: '3-4',
    question: 'A big ________ travels very fast in the sky.',
    answer: 'airplane',
    distractors: ['bicycle', 'motorcycle', 'truck', 'subway']
  },
  {
    id: 'g34_att_15',
    type: 'attack',
    grade: '3-4',
    question: 'The farmer grows green ________ in the soil.',
    answer: 'vegetables',
    distractors: ['cakes', 'candies', 'pillows', 'computers']
  },
  {
    id: 'g34_att_16',
    type: 'attack',
    grade: '3-4',
    question: 'We use a sharp ________ to cut the birthday cake.',
    answer: 'knife',
    distractors: ['spoon', 'pencil', 'crayon', 'ruler']
  },

  // ===== GRADE 3-4 DEFENSE (GRAMMAR) =====
  {
    id: 'g34_def_1',
    type: 'defense',
    grade: '3-4',
    question: 'Yesterday, we ________ an interesting movie at home.',
    answer: 'watched',
    distractors: ['watch', 'watching', 'watches', 'will watch']
  },
  {
    id: 'g34_def_2',
    type: 'defense',
    grade: '3-4',
    question: 'He does not ________ any hot milk today.',
    answer: 'want',
    distractors: ['wants', 'wanted', 'wanting', 'to want']
  },
  {
    id: 'g34_def_3',
    type: 'defense',
    grade: '3-4',
    question: 'The birds ________ singing beautifully in the tree right now.',
    answer: 'are',
    distractors: ['is', 'was', 'am', 'be']
  },
  {
    id: 'g34_def_4',
    type: 'defense',
    grade: '3-4',
    question: 'Did you ________ your homework yesterday evening?',
    answer: 'finish',
    distractors: ['finished', 'finishing', 'finishes', 'will finish']
  },
  {
    id: 'g34_def_5',
    type: 'defense',
    grade: '3-4',
    question: 'The ball rolled ________ the sofa, so we could not find it.',
    answer: 'under',
    distractors: ['on', 'above', 'through', 'over']
  },
  {
    id: 'g34_def_6',
    type: 'defense',
    grade: '3-4',
    question: 'If it rains tomorrow, we ________ stay at home.',
    answer: 'will',
    distractors: ['are', 'did', 'would', 'have']
  },
  {
    id: 'g34_def_7',
    type: 'defense',
    grade: '3-4',
    question: 'Last Sunday, we ________ to the beach.',
    answer: 'went',
    distractors: ['go', 'going', 'goes', 'will go']
  },
  {
    id: 'g34_def_8',
    type: 'defense',
    grade: '3-4',
    question: 'She is taller ________ her elder brother.',
    answer: 'than',
    distractors: ['then', 'that', 'with', 'from']
  },
  {
    id: 'g34_def_9',
    type: 'defense',
    grade: '3-4',
    question: 'How ________ water do you drink every day?',
    answer: 'much',
    distractors: ['many', 'some', 'any', 'few']
  },
  {
    id: 'g34_def_10',
    type: 'defense',
    grade: '3-4',
    question: 'He ________ play tennis because he hurt his arm.',
    answer: 'cannot',
    distractors: ['does not', 'is not', 'did not', 'will not']
  },
  {
    id: 'g34_def_11',
    type: 'defense',
    grade: '3-4',
    question: 'They ________ dinner when the bell rang.',
    answer: 'were eating',
    distractors: ['are eating', 'ate', 'eats', 'will eat']
  },
  {
    id: 'g34_def_12',
    type: 'defense',
    grade: '3-4',
    question: '________ is your English teacher? (英文老師是誰)',
    answer: 'Who',
    distractors: ['What', 'Where', 'Why', 'How']
  },
  {
    id: 'g34_def_13',
    type: 'defense',
    grade: '3-4',
    question: 'If you study hard, you ________ pass the test.',
    answer: 'will',
    distractors: ['did', 'are', 'were', 'had']
  },
  {
    id: 'g34_def_14',
    type: 'defense',
    grade: '3-4',
    question: 'This book is ________ than that one.',
    answer: 'better',
    distractors: ['good', 'best', 'well', 'gooder']
  }
];

export function getOptionsForQuestion(question: Question, optionCount: number): string[] {
  const options = [question.answer];
  const distractorsPool = [...question.distractors];

  // Pick unique distractors
  const countToPick = Math.min(optionCount - 1, distractorsPool.length);
  const selectedDistractors: string[] = [];
  
  for (let i = 0; i < countToPick; i++) {
    const randomIndex = Math.floor(Math.random() * distractorsPool.length);
    selectedDistractors.push(distractorsPool.splice(randomIndex, 1)[0]);
  }
  
  options.push(...selectedDistractors);

  // If we still need more options, add placeholders
  while (options.length < optionCount) {
    options.push(`option_${options.length}`);
  }

  // Shuffle options
  return options.sort(() => 0.5 - Math.random());
}
