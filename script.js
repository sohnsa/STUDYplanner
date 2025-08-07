
class StudyPlanner {
    constructor() {
        this.selectedSubjects = [];
        this.subjectImportance = {};
        this.studyPlan = [];
        this.dailySubjects = 3;
        this.daysUntilExam = 0;
        
        this.initEventListeners();
        this.setTodayDate();
    }

    initEventListeners() {
        // 날짜 변경 이벤트
        document.getElementById('todayDate').addEventListener('change', () => this.calculateDaysLeft());
        document.getElementById('examDate').addEventListener('change', () => this.calculateDaysLeft());
        
        // 과목 선택 이벤트
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleSubjectSelection(e));
        });
        
        
        
        // 하루 과목 수 변경
        document.getElementById('dailySubjects').addEventListener('change', (e) => {
            this.dailySubjects = parseInt(e.target.value);
        });
        
        // 계획 생성 버튼
        document.getElementById('generatePlan').addEventListener('click', () => this.generateStudyPlan());
        
        // 계획 초기화 버튼
        document.getElementById('resetPlan').addEventListener('click', () => this.resetPlan());
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('todayDate').value = today;
        this.calculateDaysLeft();
    }

    calculateDaysLeft() {
        const todayDate = new Date(document.getElementById('todayDate').value);
        const examDate = new Date(document.getElementById('examDate').value);
        
        if (todayDate && examDate && examDate > todayDate) {
            const timeDiff = examDate.getTime() - todayDate.getTime();
            this.daysUntilExam = Math.ceil(timeDiff / (1000 * 3600 * 24));
            document.getElementById('daysLeft').textContent = `남은 일수: ${this.daysUntilExam}일`;
        } else {
            document.getElementById('daysLeft').textContent = '남은 일수: -';
            this.daysUntilExam = 0;
        }
    }

    

    handleSubjectSelection(e) {
        const subject = e.target.value;
        
        if (e.target.checked) {
            this.addSubject(subject);
        } else {
            this.removeSubject(subject);
        }
        
        this.updateImportanceSection();
    }

    addSubject(subject) {
        if (!this.selectedSubjects.includes(subject)) {
            this.selectedSubjects.push(subject);
            this.subjectImportance[subject] = 3; // 기본 중요도
        }
    }

    removeSubject(subject) {
        this.selectedSubjects = this.selectedSubjects.filter(s => s !== subject);
        delete this.subjectImportance[subject];
    }

    updateImportanceSection() {
        const importanceSection = document.getElementById('importance-section');
        const importanceList = document.getElementById('importance-list');
        
        if (this.selectedSubjects.length === 0) {
            importanceSection.style.display = 'none';
            return;
        }
        
        importanceSection.style.display = 'block';
        importanceList.innerHTML = '';
        
        this.selectedSubjects.forEach(subject => {
            const importanceItem = document.createElement('div');
            importanceItem.className = 'importance-item';
            
            importanceItem.innerHTML = `
                <label>${subject}</label>
                <div class="star-rating" data-subject="${subject}">
                    ${[1,2,3,4,5].map(i => 
                        `<span class="star ${i <= this.subjectImportance[subject] ? 'active' : ''}" data-rating="${i}">★</span>`
                    ).join('')}
                </div>
            `;
            
            importanceList.appendChild(importanceItem);
        });
        
        // 별점 클릭 이벤트
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => this.handleImportanceRating(e));
        });
    }

    handleImportanceRating(e) {
        const rating = parseInt(e.target.dataset.rating);
        const subject = e.target.closest('.star-rating').dataset.subject;
        
        this.subjectImportance[subject] = rating;
        
        // 별점 업데이트
        const stars = e.target.closest('.star-rating').querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    generateStudyPlan() {
        if (this.selectedSubjects.length === 0 || this.daysUntilExam === 0) {
            alert('과목을 선택하고 시험 날짜를 설정해주세요.');
            return;
        }
        
        this.studyPlan = this.createOptimalPlan();
        this.renderStudyPlan();
        document.getElementById('planSection').style.display = 'block';
    }

    createOptimalPlan() {
        const plan = [];
        const todayDate = new Date(document.getElementById('todayDate').value);
        
        // 과목별 우선순위 계산 (중요도가 높을수록 더 자주)
        const subjectWeights = {};
        this.selectedSubjects.forEach(subject => {
            subjectWeights[subject] = this.subjectImportance[subject];
        });
        
        // 전체 기간 동안 과목 분배
        const totalSlots = this.daysUntilExam * this.dailySubjects;
        const subjectFrequency = this.calculateSubjectFrequency(subjectWeights, totalSlots);
        
        // 과목 순서 섞기 (가중치 기반)
        const subjectPool = [];
        Object.entries(subjectFrequency).forEach(([subject, frequency]) => {
            for (let i = 0; i < frequency; i++) {
                subjectPool.push(subject);
            }
        });
        
        // 날짜별 계획 생성
        for (let day = 0; day < this.daysUntilExam; day++) {
            const currentDate = new Date(todayDate);
            currentDate.setDate(currentDate.getDate() + day);
            
            const daySubjects = [];
            const shuffledPool = [...subjectPool];
            
            // 하루에 공부할 과목 선택 (중복 제거)
            for (let i = 0; i < this.dailySubjects && shuffledPool.length > 0; i++) {
                let selectedIndex;
                let attempts = 0;
                
                do {
                    selectedIndex = Math.floor(Math.random() * shuffledPool.length);
                    attempts++;
                } while (daySubjects.includes(shuffledPool[selectedIndex]) && attempts < 10);
                
                if (!daySubjects.includes(shuffledPool[selectedIndex])) {
                    daySubjects.push(shuffledPool[selectedIndex]);
                    shuffledPool.splice(selectedIndex, 1);
                }
            }
            
            plan.push({
                date: currentDate.toISOString().split('T')[0],
                subjects: daySubjects,
                dayNumber: day + 1
            });
        }
        
        return plan;
    }

    calculateSubjectFrequency(weights, totalSlots) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        const frequency = {};
        
        Object.entries(weights).forEach(([subject, weight]) => {
            frequency[subject] = Math.max(1, Math.round((weight / totalWeight) * totalSlots));
        });
        
        return frequency;
    }

    renderStudyPlan() {
        const planContainer = document.getElementById('studyPlan');
        planContainer.innerHTML = '';
        
        this.studyPlan.forEach((dayPlan, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day-plan';
            dayElement.innerHTML = `
                <div class="day-header">
                    <div class="day-title">Day ${dayPlan.dayNumber}</div>
                    <div class="day-date">${this.formatDate(dayPlan.date)}</div>
                </div>
                <div class="subjects-list" data-day="${index}">
                    ${dayPlan.subjects.map(subject => 
                        `<div class="subject-tag importance-${this.subjectImportance[subject]}" draggable="true" data-subject="${subject}">
                            ${subject}
                        </div>`
                    ).join('')}
                </div>
            `;
            
            planContainer.appendChild(dayElement);
        });
        
        this.initDragAndDrop();
    }

    initDragAndDrop() {
        let draggedElement = null;
        
        // 드래그 시작
        document.querySelectorAll('.subject-tag').forEach(tag => {
            tag.addEventListener('dragstart', (e) => {
                draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            tag.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                draggedElement = null;
            });
        });
        
        // 드롭 영역
        document.querySelectorAll('.subjects-list').forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.target.classList.add('drag-over');
            });
            
            list.addEventListener('dragleave', (e) => {
                if (!e.target.contains(e.relatedTarget)) {
                    e.target.classList.remove('drag-over');
                }
            });
            
            list.addEventListener('drop', (e) => {
                e.preventDefault();
                e.target.classList.remove('drag-over');
                
                if (draggedElement && e.target.classList.contains('subjects-list')) {
                    // 원래 위치에서 제거
                    const originalDay = parseInt(draggedElement.closest('.subjects-list').dataset.day);
                    const targetDay = parseInt(e.target.dataset.day);
                    const subject = draggedElement.dataset.subject;
                    
                    // 계획 업데이트
                    this.moveSubject(originalDay, targetDay, subject);
                    
                    // DOM 업데이트
                    e.target.appendChild(draggedElement);
                }
            });
        });
    }

    moveSubject(fromDay, toDay, subject) {
        // 원래 날짜에서 과목 제거
        this.studyPlan[fromDay].subjects = this.studyPlan[fromDay].subjects.filter(s => s !== subject);
        
        // 새 날짜에 과목 추가
        if (!this.studyPlan[toDay].subjects.includes(subject)) {
            this.studyPlan[toDay].subjects.push(subject);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
    }

    resetPlan() {
        this.studyPlan = [];
        document.getElementById('planSection').style.display = 'none';
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new StudyPlanner();
});
