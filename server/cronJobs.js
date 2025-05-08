import { initializeDB, storyBookDb } from './db.js';
import { checkAndUnlockDailyChapters } from './storybook.js';

/**
 * Process daily chapter unlocks for all premium storybooks
 * This should be scheduled to run once per day
 */
export const processDailyChapterUnlocks = async () => {
  console.log('Running daily chapter unlock job...');
  
  try {
    // Get all premium storybooks that have locked chapters
    const db = await initializeDB();
    const premiumStorybooks = await db.collection('storybooks').find({
      is_premium: true,
      $expr: { $lt: ["$chapters_unlocked_count", "$chapters_total_count"] }
    }).toArray();
    
    console.log(`Found ${premiumStorybooks.length} premium storybooks with locked chapters`);
    
    const results = [];
    
    // Process each storybook
    for (const storyBook of premiumStorybooks) {
      try {
        const updatedStoryBook = await checkAndUnlockDailyChapters(storyBook.id);
        
        if (updatedStoryBook && updatedStoryBook.chapters_unlocked_count > storyBook.chapters_unlocked_count) {
          const chaptersUnlocked = updatedStoryBook.chapters_unlocked_count - storyBook.chapters_unlocked_count;
          
          results.push({
            storyBookId: storyBook.id,
            heroId: storyBook.heroId,
            previousCount: storyBook.chapters_unlocked_count,
            newCount: updatedStoryBook.chapters_unlocked_count,
            chaptersUnlocked
          });
          
          console.log(`Unlocked ${chaptersUnlocked} chapters for storybook ${storyBook.id} (hero ${storyBook.heroId})`);
        }
      } catch (error) {
        console.error(`Error processing storybook ${storyBook.id}:`, error);
      }
    }
    
    console.log(`Successfully processed ${results.length} storybooks`);
    return {
      processed: premiumStorybooks.length,
      unlocked: results.length,
      results
    };
  } catch (error) {
    console.error('Error in daily chapter unlock job:', error);
    throw error;
  }
};

// If run directly from the command line
if (process.argv[1] === import.meta.url) {
  processDailyChapterUnlocks()
    .then(result => {
      console.log('Daily chapter unlock job completed successfully:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Daily chapter unlock job failed:', error);
      process.exit(1);
    });
} 