import { ai } from './groq';

async function testGroq() {
  console.log('Testing Groq implementation...');
  
  try {
    const messages = [{
      role: 'user',
      content: [{ text: 'Hello! Can you give me a brief test response?' }]
    }];

    console.log('Sending test message...');
    
    for await (const chunk of ai.generateStream({ messages })) {
      if (chunk.type === 'text' && chunk.content) {
        process.stdout.write(chunk.content);
      }
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testGroq(); 