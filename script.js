// Global variables
let currentSection = 'today';
let budgetMode = 'budget'; // 'budget' or 'premium'
let nutritionChart = null;
let workoutChart = null;
let caloriesTrendChart = null;
let workoutFrequencyChart = null;

// Food database with calories per serving
const foodDatabase = {
    'boiled eggs': { calories: 70, protein: 6, cost: 'low', serving: '1 egg' },
    'chicken breast': { calories: 165, protein: 31, cost: 'medium', serving: '100g' },
    'brown rice': { calories: 111, protein: 2.6, cost: 'low', serving: '1 cup cooked' },
    'oats': { calories: 68, protein: 2.4, cost: 'low', serving: '1/2 cup dry' },
    'banana': { calories: 105, protein: 1.3, cost: 'low', serving: '1 medium' },
    'tuna': { calories: 154, protein: 25, cost: 'medium', serving: '100g canned' },
    'lentils': { calories: 116, protein: 9, cost: 'low', serving: '1/2 cup cooked' },
    'greek yogurt': { calories: 100, protein: 17, cost: 'medium', serving: '170g' },
    'almonds': { calories: 164, protein: 6, cost: 'high', serving: '28g (24 nuts)' },
    'salmon': { calories: 206, protein: 22, cost: 'high', serving: '100g' },
    'quinoa': { calories: 111, protein: 4, cost: 'high', serving: '1/2 cup cooked' },
    'sweet potato': { calories: 112, protein: 2, cost: 'low', serving: '1 medium' },
    'spinach': { calories: 7, protein: 0.9, cost: 'low', serving: '1 cup' },
    'cottage cheese': { calories: 98, protein: 11, cost: 'medium', serving: '1/2 cup' },
    'beef': { calories: 250, protein: 26, cost: 'high', serving: '100g lean' }
};

// Workout calorie burn rates (calories per minute)
const workoutCalories = {
    'strength': 6, // Average for strength training
    'cardio': 8    // Average for cardio
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadData();
    updateDisplay();
    setCurrentDate();
    initializeCharts();
    checkHealthStatus();
});

function initializeApp() {
    // Navigation handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Budget handlers
    document.getElementById('budget-yes').addEventListener('click', () => setBudgetMode('premium'));
    document.getElementById('budget-no').addEventListener('click', () => setBudgetMode('budget'));

    // Modal handlers
    setupModalHandlers();

    // Quick action handlers
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]').dataset.action;
            handleQuickAction(action);
        });
    });

    // Form handlers
    setupFormHandlers();

    // Alert close handler
    document.querySelector('.alert-close')?.addEventListener('click', () => {
        document.getElementById('health-alert').classList.add('hidden');
    });
}

function switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    currentSection = section;

    // Load section-specific data
    if (section === 'progress') {
        updateProgressCharts();
    } else if (section === 'sixpack') {
        updateSixPackContent();
    } else if (section === 'nutrition') {
        updateNutritionChart();
        displayFoodRecommendations();
    } else if (section === 'workout') {
        updateWorkoutChart();
    }
}

function setBudgetMode(mode) {
    budgetMode = mode;
    const statusEl = document.getElementById('budget-status');
    
    if (mode === 'premium') {
        statusEl.textContent = '✨ Premium mode enabled! You\'ll get high-quality food recommendations.';
        statusEl.className = 'budget-status premium';
    } else {
        statusEl.textContent = '💰 Budget mode enabled! You\'ll get cost-effective meal suggestions.';
        statusEl.className = 'budget-status budget';
    }

    // Update plan type display
    document.getElementById('plan-type').textContent = mode === 'premium' ? 'Premium Plan' : 'Budget Plan';

    // Save to localStorage
    localStorage.setItem('budgetMode', mode);

    // Update recommendations
    displayFoodRecommendations();
    updateSixPackContent();
}

function setupModalHandlers() {
    // Food modal
    document.getElementById('add-food-btn').addEventListener('click', () => {
        document.getElementById('food-modal').classList.add('active');
    });

    // Workout modal  
    document.getElementById('add-workout-btn').addEventListener('click', () => {
        document.getElementById('workout-modal').classList.add('active');
    });

    // Close modal handlers
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Workout type change handler
    document.getElementById('workout-type').addEventListener('change', (e) => {
        const strengthFields = document.getElementById('strength-fields');
        if (e.target.value === 'strength') {
            strengthFields.style.display = 'grid';
        } else {
            strengthFields.style.display = 'none';
        }
    });
}

function setupFormHandlers() {
    // Food form
    document.getElementById('food-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addFoodEntry();
    });

    // Workout form
    document.getElementById('workout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addWorkoutEntry();
    });
}

function handleQuickAction(action) {
    switch(action) {
        case 'add-meal':
            document.getElementById('food-modal').classList.add('active');
            break;
        case 'log-workout':
            document.getElementById('workout-modal').classList.add('active');
            break;
        case 'sixpack-workout':
            switchSection('sixpack');
            break;
    }
}

function addFoodEntry() {
    const name = document.getElementById('food-name').value;
    const quantity = document.getElementById('food-quantity').value;
    const mealTime = document.getElementById('meal-time').value;

    const entry = {
        id: Date.now(),
        name: name.toLowerCase(),
        quantity: quantity,
        mealTime: mealTime,
        timestamp: new Date().toISOString(),
        calories: calculateCalories(name.toLowerCase(), quantity),
        protein: calculateProtein(name.toLowerCase(), quantity)
    };

    // Save to localStorage
    const entries = getFoodEntries();
    entries.push(entry);
    localStorage.setItem('foodEntries', JSON.stringify(entries));

    // Update display
    updateDisplay();
    updateNutritionChart();

    // Close modal and reset form
    document.getElementById('food-modal').classList.remove('active');
    document.getElementById('food-form').reset();

    // Check for health alerts
    checkHealthStatus();
}

function addWorkoutEntry() {
    const name = document.getElementById('workout-name').value;
    const type = document.getElementById('workout-type').value;
    const sets = document.getElementById('workout-sets').value;
    const reps = document.getElementById('workout-reps').value;
    const duration = parseInt(document.getElementById('workout-duration').value);

    const entry = {
        id: Date.now(),
        name: name,
        type: type,
        sets: sets || null,
        reps: reps || null,
        duration: duration,
        timestamp: new Date().toISOString(),
        caloriesBurned: calculateWorkoutCalories(type, duration)
    };

    // Save to localStorage
    const entries = getWorkoutEntries();
    entries.push(entry);
    localStorage.setItem('workoutEntries', JSON.stringify(entries));

    // Update display
    updateDisplay();
    updateWorkoutChart();

    // Close modal and reset form
    document.getElementById('workout-modal').classList.remove('active');
    document.getElementById('workout-form').reset();

    // Check for health alerts
    checkHealthStatus();
}

function calculateCalories(foodName, quantity) {
    const food = foodDatabase[foodName];
    if (!food) return 100; // Default estimate

    // Simple quantity parsing - in a real app, this would be more sophisticated
    const multiplier = parseFloat(quantity) || 1;
    return Math.round(food.calories * multiplier);
}

function calculateProtein(foodName, quantity) {
    const food = foodDatabase[foodName];
    if (!food) return 5; // Default estimate

    const multiplier = parseFloat(quantity) || 1;
    return Math.round(food.protein * multiplier * 10) / 10;
}

function calculateWorkoutCalories(type, duration) {
    const rate = workoutCalories[type] || 6;
    return Math.round(rate * duration);
}

function getFoodEntries() {
    return JSON.parse(localStorage.getItem('foodEntries') || '[]');
}

function getWorkoutEntries() {
    return JSON.parse(localStorage.getItem('workoutEntries') || '[]');
}

function getTodayEntries(entries) {
    const today = new Date().toDateString();
    return entries.filter(entry => 
        new Date(entry.timestamp).toDateString() === today
    );
}

function updateDisplay() {
    updateTodayStats();
    updateFoodLog();
    updateWorkoutLog();
    updateAchievements();
}

function updateTodayStats() {
    const foodEntries = getTodayEntries(getFoodEntries());
    const workoutEntries = getTodayEntries(getWorkoutEntries());

    // Calculate totals
    const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const totalProtein = foodEntries.reduce((sum, entry) => sum + entry.protein, 0);
    const totalWorkouts = workoutEntries.length;
    const totalDuration = workoutEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // Update display
    document.getElementById('today-calories').textContent = totalCalories;
    document.getElementById('today-protein').textContent = totalProtein + 'g';
    document.getElementById('today-workouts').textContent = totalWorkouts;
    document.getElementById('today-duration').textContent = totalDuration + 'min';
}

function updateFoodLog() {
    const entries = getFoodEntries().slice(-10).reverse(); // Show last 10 entries
    const container = document.getElementById('food-entries');
    
    container.innerHTML = entries.map(entry => `
        <div class="food-entry">
            <div class="entry-header">
                <div class="entry-title">${entry.name} (${entry.quantity})</div>
                <div class="entry-time">${formatTime(entry.timestamp)}</div>
            </div>
            <div class="entry-details">
                <span>📍 ${entry.mealTime}</span>
                <span>🔥 ${entry.calories} cal</span>
                <span>🥩 ${entry.protein}g protein</span>
            </div>
        </div>
    `).join('');
}

function updateWorkoutLog() {
    const entries = getWorkoutEntries().slice(-10).reverse(); // Show last 10 entries
    const container = document.getElementById('workout-entries');
    
    container.innerHTML = entries.map(entry => `
        <div class="workout-entry">
            <div class="entry-header">
                <div class="entry-title">${entry.name}</div>
                <div class="entry-time">${formatTime(entry.timestamp)}</div>
            </div>
            <div class="entry-details">
                <span>💪 ${entry.type}</span>
                ${entry.sets ? `<span>📊 ${entry.sets} × ${entry.reps}</span>` : ''}
                <span>⏱️ ${entry.duration}min</span>
                <span>🔥 ${entry.caloriesBurned} cal</span>
            </div>
        </div>
    `).join('');
}

function displayFoodRecommendations() {
    const container = document.getElementById('food-recommendations');
    const foods = Object.entries(foodDatabase);
    
    // Filter based on budget mode
    const filteredFoods = foods.filter(([name, data]) => {
        if (budgetMode === 'budget') {
            return data.cost === 'low' || data.cost === 'medium';
        }
        return true; // Premium mode shows all foods
    });

    container.innerHTML = filteredFoods.slice(0, 6).map(([name, data]) => `
        <div class="recommendation-item">
            <h4>${name}</h4>
            <p>${data.serving}</p>
            <div class="nutrition-info">
                <span>🔥 ${data.calories} cal</span>
                <span>🥩 ${data.protein}g protein</span>
                <span>💰 ${data.cost} cost</span>
            </div>
        </div>
    `).join('');
}

function updateSixPackContent() {
    const exercises = budgetMode === 'premium' ? 
        [
            { name: 'Plank Hold', description: '3 sets, 60 seconds each. Focus on core engagement.' },
            { name: 'Russian Twists', description: '3 sets of 20 reps each side. Use a weight if available.' },
            { name: 'Mountain Climbers', description: '3 sets of 30 seconds. High intensity.' },
            { name: 'Dead Bug', description: '3 sets of 10 each side. Slow and controlled.' },
            { name: 'Bicycle Crunches', description: '3 sets of 20 each side. Focus on form.' }
        ] :
        [
            { name: 'Basic Plank', description: '3 sets, 30-45 seconds each. Build up gradually.' },
            { name: 'Crunches', description: '3 sets of 15 reps. Focus on controlled movement.' },
            { name: 'Leg Raises', description: '3 sets of 10 reps. Keep legs straight.' },
            { name: 'Side Plank', description: '2 sets, 20 seconds each side. Build up strength.' }
        ];

    const dietPlan = budgetMode === 'premium' ?
        [
            { name: 'Cutting Breakfast', description: 'Greek yogurt with berries and almonds. High protein, controlled carbs.' },
            { name: 'Power Lunch', description: 'Grilled salmon with quinoa and spinach. Omega-3 rich.' },
            { name: 'Light Dinner', description: 'Lean beef with sweet potato. Perfect for cutting phase.' },
            { name: 'Pre-workout', description: 'Banana with almond butter. Quick energy boost.' }
        ] :
        [
            { name: 'Budget Breakfast', description: 'Oats with banana and boiled eggs. Affordable and filling.' },
            { name: 'Simple Lunch', description: 'Tuna with brown rice and spinach. High protein, low cost.' },
            { name: 'Dinner', description: 'Chicken breast with lentils. Great protein sources.' },
            { name: 'Snack', description: 'Cottage cheese with apple. Budget-friendly protein.' }
        ];

    document.getElementById('core-exercises').innerHTML = exercises.map(exercise => `
        <div class="exercise-item">
            <h4>${exercise.name}</h4>
            <p>${exercise.description}</p>
        </div>
    `).join('');

    document.getElementById('cutting-diet').innerHTML = dietPlan.map(meal => `
        <div class="diet-item">
            <h4>${meal.name}</h4>
            <p>${meal.description}</p>
        </div>
    `).join('');
}

function initializeCharts() {
    // Nutrition Chart
    const nutritionCtx = document.getElementById('nutrition-chart');
    if (nutritionCtx) {
        nutritionChart = new Chart(nutritionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Calories Consumed', 'Remaining'],
                datasets: [{
                    data: [0, 2500],
                    backgroundColor: ['#4f46e5', '#e5e7eb']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Workout Chart
    const workoutCtx = document.getElementById('workout-chart');
    if (workoutCtx) {
        workoutChart = new Chart(workoutCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Workout Duration (min)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#4f46e5'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

function updateNutritionChart() {
    if (!nutritionChart) return;

    const todayEntries = getTodayEntries(getFoodEntries());
    const totalCalories = todayEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const remaining = Math.max(0, 2500 - totalCalories);

    nutritionChart.data.datasets[0].data = [totalCalories, remaining];
    nutritionChart.update();
}

function updateWorkoutChart() {
    if (!workoutChart) return;

    const entries = getWorkoutEntries();
    const weekData = Array(7).fill(0);
    
    // Calculate last 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        const dayEntries = entries.filter(entry => 
            new Date(entry.timestamp).toDateString() === date.toDateString()
        );
        weekData[i] = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    }

    workoutChart.data.datasets[0].data = weekData;
    workoutChart.update();
}

function updateProgressCharts() {
    // This would show longer-term trends
    // For now, we'll create simple placeholder charts
    
    const caloriesCtx = document.getElementById('calories-trend-chart');
    if (caloriesCtx && !caloriesTrendChart) {
        caloriesTrendChart = new Chart(caloriesCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Average Daily Calories',
                    data: [2200, 2300, 2400, 2350],
                    borderColor: '#4f46e5',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    const frequencyCtx = document.getElementById('workout-frequency-chart');
    if (frequencyCtx && !workoutFrequencyChart) {
        workoutFrequencyChart = new Chart(frequencyCtx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Workouts per Week',
                    data: [4, 5, 6, 5],
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 7
                    }
                }
            }
        });
    }
}

function updateAchievements() {
    const badges = [
        { id: 'first-meal', title: 'First Meal', description: 'Logged your first meal', icon: '🍽️' },
        { id: 'first-workout', title: 'First Workout', description: 'Completed your first workout', icon: '💪' },
        { id: 'week-streak', title: 'Week Warrior', description: 'Logged meals for 7 days', icon: '🔥' },
        { id: 'protein-goal', title: 'Protein Master', description: 'Hit protein goal 5 times', icon: '🥩' },
        { id: 'workout-streak', title: 'Fitness Fanatic', description: 'Worked out 5 days in a row', icon: '🏆' }
    ];

    const foodEntries = getFoodEntries();
    const workoutEntries = getWorkoutEntries();

    const container = document.getElementById('badges-container');
    container.innerHTML = badges.map(badge => {
        let earned = false;

        switch(badge.id) {
            case 'first-meal':
                earned = foodEntries.length > 0;
                break;
            case 'first-workout':
                earned = workoutEntries.length > 0;
                break;
            case 'week-streak':
                earned = foodEntries.length >= 7;
                break;
            case 'protein-goal':
                earned = foodEntries.filter(entry => entry.protein >= 20).length >= 5;
                break;
            case 'workout-streak':
                earned = workoutEntries.length >= 5;
                break;
        }

        return `
            <div class="badge ${earned ? 'earned' : ''}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-title">${badge.title}</div>
                <div class="badge-description">${badge.description}</div>
            </div>
        `;
    }).join('');
}

function checkHealthStatus() {
    const todayFood = getTodayEntries(getFoodEntries());
    const todayWorkouts = getTodayEntries(getWorkoutEntries());
    const totalCalories = todayFood.reduce((sum, entry) => sum + entry.calories, 0);

    let alertMessage = '';

    if (totalCalories < 1500) {
        alertMessage = 'You may be undereating today. Consider adding a healthy snack to meet your calorie goals.';
    } else if (todayWorkouts.length === 0 && new Date().getHours() > 18) {
        alertMessage = 'You haven\'t logged any workouts today. Even a short walk can help maintain your fitness routine.';
    }

    const alertEl = document.getElementById('health-alert');
    if (alertMessage) {
        alertEl.querySelector('.alert-message').textContent = alertMessage;
        alertEl.classList.remove('hidden');
    } else {
        alertEl.classList.add('hidden');
    }
}

function setCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function loadData() {
    // Load budget mode
    const savedBudgetMode = localStorage.getItem('budgetMode');
    if (savedBudgetMode) {
        setBudgetMode(savedBudgetMode);
    }
}

// Add some sample data for demo purposes
function addSampleData() {
    if (getFoodEntries().length === 0) {
        const sampleFoods = [
            { name: 'boiled eggs', quantity: '2', mealTime: 'breakfast' },
            { name: 'chicken breast', quantity: '150', mealTime: 'lunch' },
            { name: 'brown rice', quantity: '1', mealTime: 'lunch' }
        ];

        sampleFoods.forEach(food => {
            const entry = {
                id: Date.now() + Math.random(),
                name: food.name,
                quantity: food.quantity,
                mealTime: food.mealTime,
                timestamp: new Date().toISOString(),
                calories: calculateCalories(food.name, food.quantity),
                protein: calculateProtein(food.name, food.quantity)
            };

            const entries = getFoodEntries();
            entries.push(entry);
            localStorage.setItem('foodEntries', JSON.stringify(entries));
        });
    }

    if (getWorkoutEntries().length === 0) {
        const sampleWorkouts = [
            { name: 'Push-ups', type: 'strength', sets: '3', reps: '15', duration: 20 },
            { name: 'Running', type: 'cardio', duration: 30 }
        ];

        sampleWorkouts.forEach(workout => {
            const entry = {
                id: Date.now() + Math.random(),
                name: workout.name,
                type: workout.type,
                sets: workout.sets || null,
                reps: workout.reps || null,
                duration: workout.duration,
                timestamp: new Date().toISOString(),
                caloriesBurned: calculateWorkoutCalories(workout.type, workout.duration)
            };

            const entries = getWorkoutEntries();
            entries.push(entry);
            localStorage.setItem('workoutEntries', JSON.stringify(entries));
        });
    }
}

// Uncomment the line below to add sample data for testing
// addSampleData();