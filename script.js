const titles = [
    "Java.",
    "Spring Boot.",
    "Relational Databases.",
    "Docker.",
    "Git.",
    "many tools..."
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let speed = 100;

const elementTypewriter = document.getElementById('main-title');
let cardHTML = "";

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

const githubReposApiUrl = "https://api.github.com/users/ppossatto/repos";

function writeAsTypewriter() {
    const currentText = titles[textIndex];
    
    if (isDeleting) {
        elementTypewriter.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        
        if (charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % titles.length;
            speed = 500;
        } else {
            speed = 50;
        }
    } else {
        elementTypewriter.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        
        if (charIndex === currentText.length) {
            isDeleting = true;
            speed = 2000;
        } else {
            speed = 80;
        }
    }
    
    setTimeout(writeAsTypewriter, speed);
}

function addProjectsCards(){
    const repoStorageKey = "gh_repos";
        const repoContentStored = getFromLocalStorage(repoStorageKey);
        if(repoContentStored != null){
            return generateCard(repoContentStored);
        } else {
            fetch(githubReposApiUrl)
                .then(response => {
                    if(!response.ok){
                        throw new Error('Fetch data from GitHub was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    saveInLocalStorage(repoStorageKey, data);
                    generateCard(data)
                })
                .catch(error => {
                    console.log(error);
                })
        }
    
}

async function generateCard(response) {
    try {
        const promises = response.map(async (element) => {
            const languagesUrl = `https://api.github.com/repos/ppossatto/${element.name}/languages`;
            const tags = await getLanguages(languagesUrl, element.name);
            
            return {
                ...element,
                languageTags: tags
            };
        });
        
        const elementsWithTags = await Promise.all(promises);
        let cardHTML = "";
        let cardsCount = 0;
        elementsWithTags.forEach(element => {
            if(cardsCount < 3 && element.name != "ppossatto" && !element.private){
                cardHTML += `
                <div class="card border-primary mb-3" style="max-width: 30%; margin-right: 1%; min-width: 20%">
                    <div class="card-header">GitHub</div>
                    <div class="card-body d-flex flex-column" style="height: 100%;">
                        <h4 class="card-title">${element.name}</h4>
                        <p class="card-text flex-grow-1">${element.description || 'No Description'}</p>
                        <div class="mb-3">
                            ${element.languageTags}
                        </div>
                        <div class="mt-auto">
                            <a href="${element.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg active" role="button" aria-pressed="true">
                                <i class="bi bi-github"></i> Repository
                            </a>
                        </div>
                    </div>
                </div>
                `;
                cardsCount++;
            }
        });
        
        const cardsElement = document.getElementById("dynamic-cards");
        cardsElement.innerHTML = cardHTML;
        
    } catch (error) {
        console.error("Error generating cards:", error);
    }
}

function getLanguages(url, repoName) {
    const languageKey = `gh_languages_${repoName}`;
    const localStorageContent = getFromLocalStorage(languageKey);
    if(localStorageContent != null){
        let tags = '<div class="d-flex flex-xl-row justify-content-start flex-gap-10 flex-wrap">\n\t';
        let keys = Object.keys(localStorageContent);
        
        keys.forEach(key => {
            if(key != false) {
                tags += `<span class="badge rounded-pill bg-primary">${key}</span>\n`;
            }
        });
        tags += '</div>';
        return tags;
    } else {
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                let tags = '<div class="d-flex flex-xl-row justify-content-start flex-gap-10 flex-wrap">\n\t';
                let keys = Object.keys(data);
                
                keys.forEach(key => {
                    if(key != false) {
                        tags += `<span class="badge rounded-pill bg-primary">${key}</span>\n`;
                    }
                });
                tags += '</div>';
                saveInLocalStorage(languageKey, data);
                return tags;
            })
            .catch(error => {
                console.log("Something wrong happened...", error);
                return "";
            });
    }
    
}

function getFromLocalStorage(keyName){
    const response = JSON.parse(localStorage.getItem(keyName));
    const now = new Date();
    if(response == null){
        return null;
    }
    if(now.getTime() > response.expiry){
        localStorage.removeItem(keyName);
        return null;
    }
    return response.value;
}

function saveInLocalStorage(keyName, objectToSave){
    const now = new Date();
    const objectWithTTL = {
        "value": objectToSave,
        "expiry": now.getTime() + 86400000
    };
    localStorage.setItem(keyName, JSON.stringify(objectWithTTL))
    
}

writeAsTypewriter();
addProjectsCards();