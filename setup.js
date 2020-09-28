// const https = require('https');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let GET_DEGREES_URL = "https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees"
let GET_COURSES_URL = "https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/{}/courses?academicTerm={}"

let targets = ["LEIC-A", "LEIC-T", "MEIC-A"];

let excludedCourses = [
    "Opção Livre 1",
    "Opção Livre 2",
    "Opção Livre 3",
    "Projecto de Mestrado em Engenharia Informática e de Computadores",
    "Dissertação - Mestrado em Engenharia Informática e de Computadores",
];


// config objects
let enrollment_mappings = {}


let roles = {}


function setup_server() {
    // TODO: CLEAR SERVER SETTINGS


    // TODO: generate section Welcome
    // TODO: generate #welcome
    // TODO: generate #rules
    // TODO: generate #enroll-campi

    // TODO: generate section Course Announcements
    // TODO: generate section Course Discussion

    // get courses
    let degrees = get_degrees(targets);
    for(const degree of degrees) {


        // TODO: generate degree role (LEIC-A, LEIC-T, MEIC)
        let rolename = degree.acronym === 'MEIC-A' ? 'MEIC' : degree.acronym;
        let roleid = Math.floor(Math.random() * 100000000);
        console.log(`[+] Generating role ${rolename} with id ${roleid}`);


        // TODO: send message to enroll-campi with degree (DONT FORGET TO REACT TO MESSAGE)
        let enrollmentMsgId = Math.floor(Math.random() * 100000000);
        enrollment_mappings[enrollmentMsgId] = roleid;
        console.log(`[+] Sending enrollment message to #enroll-campi with id ${enrollmentMsgId}`);


        // TODO: create enrollment channel for degree
        let enrollChannelName = `enroll-${rolename}`;
        let enrollChannelId = Math.floor(Math.random() * 100000000);
        console.log(`[+] Creating enrollment channel ${enrollChannelName} with id ${enrollChannelId}`);


        console.log(`[+] Retrieving courses from ${degree.acronym}...`);
        let courses = get_courses(degree.id);
        for(const course of courses) {

            // TODO TODO: verificar se o role esta duplicado

            // TODO: generate course role
            let courseRoleName = course.acronym;
            let courseRoleId = Math.floor(Math.random() * 100000000);
            console.log(`[+] Creating role ${courseRoleName} with id ${courseRoleId}`);

            // TODO: send enrollment message to enrollment channel (DONT FORGET TO REACT TO MESSAGE)
            let enrollmentMsgId = Math.floor(Math.random() * 100000000);
            enrollment_mappings[enrollmentMsgId] = courseRoleId;
            console.log(`[+] Sending enrollment message to channel ${enrollChannelName} with id ${enrollmentMsgId}`);


            // TODO: generate course channels (DONT FORGET TO SET PERMISSIONS!)
            let announcementChannelName = `${courseRoleName}-${get_degree_letter(degree.acronym)}a`;
            let announcementChannelId = Math.floor(Math.random() * 100000000);
            console.log(`[+] Generating channel ${announcementChannelName} for degree ${degree.acronym} with id ${announcementChannelId}`);

            let discussionChannelName = `${courseRoleName}-${get_degree_letter(degree.acronym)}d`;
            let discussionChannelId = Math.floor(Math.random() * 100000000);
            console.log(`[+] Generating channel ${discussionChannelName} for degree ${degree.acronym} with id ${discussionChannelId}`);

        }
    }

    // console.log(courses);
}

function get_degree_letter(degree_name) {
    let mapping = {
        "LEIC-A": "a",
        "LEIC-T": "t",
        "MEIC-A": "m"
    };
    return mapping[degree_name];
}

function get_degrees(target_degree) {
    console.log("[+] Retrieving degrees...");
    let degrees = httpGet(GET_DEGREES_URL);
    degrees = degrees.filter((course) => target_degree.includes(course.acronym));

    let res = []
    for(const d of degrees) {
        res.push({
            'acronym': d.acronym,
            'id': d.id
        });
    }
    return res;
}

function get_courses(degreeId) {
    let semester = "2019/2020";
    let url = `https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${degreeId}/courses?academicTerm=${semester}`
    let courses = httpGet(url)

    // filter out black listed courses >:(
    courses = courses.filter(course => !excludedCourses.includes(course.name));

    let res = []
    for(const course of courses) {
        let acronym = get_acronym(course.name, course.acronym);
        let academicYear = get_academic_year("-");
        let term = course.academicTerm[0]; // get the number
        let rss = `https://fenix.tecnico.ulisboa.pt/disciplinas/${course.acronym}/${academicYear}/${term}-semestre/rss/announcement`;

        res.push({
            'name': course.name,
            'acronym': acronym,
            'id': course.id,
            'term': course.academicTerm[0],
            'rss': rss
        });
    }

    return res;
}

function get_acronym(name, acronym) {
    let customAcronyms = {
        "Cálculo Diferencial e Integral I": "CDI-I",
        "Cálculo Diferencial e Integral II": "CDI-II",
        "Gestão": "Ges",
        "Compiladores": "Compiladores",
        "Opção Livre 1": "OL1",
        "Opção Livre 2": "OL2",
        "Opção Livre 3": "OL3",
        "Portfolio Pessoal 1": "PP1",
        "Portfolio Pessoal 2": "PP2",
        "Linguagens de Programação": "LingP",
        "Aprendizagem": "Apr",
        "Bioinformática / Biologia Computacional ": "BioInf",
        "Dissertação - Mestrado em Engenharia Informática e de Computadores": "Dissert",
        "Projecto de Mestrado em Engenharia Informática e de Computadores": "ProjTese"
    }

    if(name in customAcronyms) {
        return customAcronyms[name];
    } else {
        return acronym.replace(/[\s0-9a-z]/g, ''); // remove lowercase and digits
    }
}


function get_academic_year(separator) {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    let baseYear = month>=8 ? year : year-1;
    return `${baseYear}${separator}${baseYear+1}`;
}


function httpGet(url)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false ); // false for synchronous request
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
}

setup_server();
