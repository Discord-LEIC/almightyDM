let Discord = require("discord.js");
const config = require('./config.json');

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { Guild, Permissions, DiscordAPIError} = require("discord.js");

let randomColor = require('randomcolor');

let db = require('./database.js');

let GET_DEGREES_URL = "https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees"
let GET_COURSES_URL = "https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/{}/courses?academicTerm={}"

const roleSelectionEmoji = config.roleSelectionEmoji;

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
let announcementsCategories = {}
let discussionCategories = {}
let degreeRoles = []

let roles = {}

const permissions = [
    Permissions.FLAGS.ADMINISTRATOR,
    Permissions.FLAGS.CREATE_INSTANT_INVITE,
    Permissions.FLAGS.KICK_MEMBERS,
    Permissions.FLAGS.BAN_MEMBERS,
    Permissions.FLAGS.MANAGE_CHANNELS,
    Permissions.FLAGS.MANAGE_GUILD,
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.VIEW_AUDIT_LOG,
    Permissions.FLAGS.PRIORITY_SPEAKER,
    Permissions.FLAGS.STREAM,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.SEND_TTS_MESSAGES,
    Permissions.FLAGS.MANAGE_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.ATTACH_FILES,
    Permissions.FLAGS.READ_MESSAGE_HISTORY,
    Permissions.FLAGS.MENTION_EVERYONE,
    Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
    Permissions.FLAGS.VIEW_GUILD_INSIGHTS,
    Permissions.FLAGS.CONNECT,
    Permissions.FLAGS.SPEAK,
    Permissions.FLAGS.MUTE_MEMBERS,
    Permissions.FLAGS.DEAFEN_MEMBERS,
    Permissions.FLAGS.MOVE_MEMBERS,
    Permissions.FLAGS.USE_VAD,
    Permissions.FLAGS.CHANGE_NICKNAME,
    Permissions.FLAGS.MANAGE_NICKNAMES,
    Permissions.FLAGS.MANAGE_ROLES,
    Permissions.FLAGS.MANAGE_WEBHOOKS,
    Permissions.FLAGS.MANAGE_EMOJIS
];

function generate_permissions(roleId, allowed) {
    // allows allowed
    // denies everything else
    return {
        'id': roleId,
        'type': 'role',
        'deny': permissions.filter(p => !allowed.includes(p)),
        'allow': allowed
    };
}

async function setup_server(serverGuild) {
    // TODO: Uncomment this
    // await db.createTables();

    // TODO: CLEAR SERVER SETTINGS
    console.log("Setting up server");
    const everyoneRoleId = serverGuild.id;

    let staffRole = await create_role(serverGuild, {
        'data': {
            'name': 'staff',
            'mentionable': true,
            'color': '#14b36e'
        }
    });

    let authenticatedID = await create_role(serverGuild, {
        'data': {
            'name': 'student',
            'mentionable': false,
            'color': '#ffffff'
        }
    });

    await create_staff_section(serverGuild, everyoneRoleId);

    console.log(`[+] Creating the Welcome Section`)
    let welcomeCategory = await create_channel(serverGuild, '🎓Welcome', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    let welcomeText = await create_channel(serverGuild, 'welcome', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                Permissions.FLAGS.ADD_REACTIONS
            ])
        ]
    });
    db.insertChannel(welcomeText.id, "welcomeChannelID");

    let rulesText = await create_channel(serverGuild, 'rules', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY
            ])
        ]
    });

    let faqText = await create_channel(serverGuild, 'faq', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY
            ]),
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    let studyText = await create_channel(serverGuild, 'study-material', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY
            ]),
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    let degreeText = await create_channel(serverGuild, 'enroll-degree', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(authenticatedID, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                Permissions.FLAGS.ADD_REACTIONS
            ]),
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });
    db.insertChannel(degreeText.id, "enrollDegreeChannelID")

    let yearText = await create_channel(serverGuild, 'enroll-year', {
        'type': 'text',
        'parent': welcomeCategory.id,
        'permissionOverwrites': [
            generate_permissions(authenticatedID, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                Permissions.FLAGS.ADD_REACTIONS
            ]),
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });
    db.insertChannel(yearText.id, "enrollYearChannelID")

    //TODO: This is very ugly
    announcementsCategories['LEIC-A'] = await create_channel(serverGuild, 'Announcements-A', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    announcementsCategories['LEIC-T'] = await create_channel(serverGuild, 'Announcements-T', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    announcementsCategories['MEIC'] = await create_channel(serverGuild, 'Announcements-M', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    discussionCategories['LEIC-A'] =  await create_channel(serverGuild, 'Discussion-A', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    discussionCategories['LEIC-T'] =  await create_channel(serverGuild, 'Discussion-T', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    discussionCategories['MEIC'] =  await create_channel(serverGuild, 'Discussion-M', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });
    //END TODO

    let degrees = get_degrees(targets);
    console.log(`[+] Got degrees ${degrees}`);

    for(const degree of degrees) {

        let degreeRoleName = degree.acronym === 'MEIC-A' ? 'MEIC' : degree.acronym;
        degreeRole = await create_role(serverGuild, {
            'data': {
                'name': degreeRoleName,
                'mentionable': true
            }
        });

        degreeRoles.push(degreeRole);

        // TODO: send message to enroll-degree with degree (DONT FORGET TO REACT TO MESSAGE)
        let message = await send_subscription_message(
            `[${degreeRoleName}] Enroll in this degree`,
            null,
            `If you're currently enrolled in this degree react with ✋ \
            to this message to gain the <@&${degreeRole.id}> role, giving \
            you access to specific content. If at any point you wish to lose \
            this role just remove the react.`,
            '#009de0',
            degreeText);

        db.insertRoleMessage(degreeRole.id, message.id);

        // TODO: create enrollment channel for degree
        let enrollChannelName = `enroll-${degreeRoleName}`;
        let enrollChannel = await create_channel(serverGuild, enrollChannelName, {
            'type': 'text',
            'parent': welcomeCategory.id,
            'permissionOverwrites': [
                generate_permissions(degreeRole.id, [
                    Permissions.FLAGS.VIEW_CHANNEL,
                    Permissions.FLAGS.READ_MESSAGE_HISTORY,
                    Permissions.FLAGS.ADD_REACTIONS
                ]),
                generate_permissions(everyoneRoleId, [
                ])
            ]
        });
        db.insertChannel(enrollChannel.id, `enroll${degreeRoleName}ChannelID`)
        console.log(`[+] Creating enrollment channel ${enrollChannelName} with id ${enrollChannel.id}`);

        console.log(`[+] Retrieving courses from ${degree.acronym}...`);
        let courses = get_courses(degree.id);

        for(const course of courses) {

            // TODO TODO: verificar se o role esta duplicado

            // Generate course role
            let courseRoleName = `${course.acronym}`;
            if(!(degreeRoleName === "MEIC")) {
                courseRoleName += `-${get_degree_letter(degreeRoleName)}`;
            }
            courseRole = await create_role(serverGuild, {
                'data': {
                    'name': courseRoleName,
                    'mentionable': true
                }
            });

            // Sends enrollment message to enrollment channel 
            let message = await send_subscription_message(
            `[${courseRoleName}] Enroll in this course`,
            null,
            `If you're currently enrolled in this course react with ✋ \
            to this message to gain the <@&${courseRole.id}> role, giving \
            you access to the specific announcement and discussion channels. \
            If at any point you wish to lose this role just remove the react.`,
            randomColor(),
            enrollChannel);

            enrollment_mappings[message.id] = courseRole.id.toString();

            // Generates course channels
            if(degreeRoleName === "MEIC")
                courseRoleName +='-';

            let announcementChannelName = `${courseRoleName}a`;
            let announcementChannel = await create_channel(serverGuild, announcementChannelName, {
                'type': 'text',
                'parent': announcementsCategories[degreeRoleName].id,
                'permissionOverwrites': [
                    generate_permissions(courseRole.id, [
                        Permissions.FLAGS.VIEW_CHANNEL,
                        Permissions.FLAGS.READ_MESSAGE_HISTORY,
                        Permissions.FLAGS.ADD_REACTIONS
                    ]),
                    generate_permissions(everyoneRoleId, [
                    ])
                ]
            });

            let discussionChannelName = `${courseRoleName}d`;
            let discussionChannel = await create_channel(serverGuild, discussionChannelName, {
                'type': 'text',
                'parent': discussionCategories[degreeRoleName].id,
                'permissionOverwrites': [
                    generate_permissions(courseRole.id, [
                        Permissions.FLAGS.VIEW_CHANNEL,
                        Permissions.FLAGS.READ_MESSAGE_HISTORY,
                        Permissions.FLAGS.ADD_REACTIONS,
                        Permissions.FLAGS.SEND_MESSAGES,
                        Permissions.FLAGS.SEND_TTS_MESSAGES,
                        Permissions.FLAGS.EMBED_LINKS,
                        Permissions.FLAGS.ATTACH_FILES,
                        Permissions.FLAGS.USE_EXTERNAL_EMOJIS
                    ]),
                    generate_permissions(everyoneRoleId, [
                    ])
                ]
            });

            if (courseRoleName.charAt(courseRoleName.length -1) == "-") courseRoleName = courseRoleName.slice(0,-1);
            // TODO: arranjar o custom acronym (está a courseRoleName)
            // TODO: Ir buscar a cor
            let color = "";

            // TODO: Uncomment this please 
            await db.insertCourse(course.id, course.name, color, course.acronym, courseRoleName, degreeRoleName, "", course.term, announcementChannel.id, course.rss);
            await db.insertRole(courseRole.id, courseRoleName, courseRole.color, message.id, courseRoleName);
        }
    }

    //Creates channels and categories
    await create_RNL_section(serverGuild, authenticatedID, everyoneRoleId);
    let arco_category = await create_Arco_section(serverGuild, authenticatedID, everyoneRoleId);
    await create_student_group_section(serverGuild, 'NEIIST', '🔸', '#f09d30', authenticatedID, everyoneRoleId);
    await create_student_group_section(serverGuild, 'SINFO', '🔹', '#295a8a', authenticatedID, everyoneRoleId);
    await create_student_group_section(serverGuild, 'GCE', '💼', '#00d3ff', authenticatedID, everyoneRoleId);
    await create_student_group_section(serverGuild, 'RNL-Admin', '💻', '#000000', authenticatedID, everyoneRoleId);
    await create_student_group_section(serverGuild, 'Praxe', '👥', '#666666', authenticatedID, everyoneRoleId);

    //Sends the messages to the initial channels
    await send_initial_messages(rulesText, welcomeText, degreeText, yearText, faqText, staffRole, everyoneRoleId, authenticatedID);
    await send_year_messages(yearText, arco_category, serverGuild, everyoneRoleId, authenticatedID);
    await send_study_messages(studyText, serverGuild);
}

async function create_channel(serverGuild, name, options){
    let channel = await serverGuild.channels.create(name, options)
        .catch(console.error);
    console.log(`[+] Creating ${options.type} channel ${name} with id ${channel.id}`);

    return channel;
}

async function create_role(serverGuild, options) {
    let role = await serverGuild.roles.create(options)
        .catch(console.error);
    console.log(`[+] Creating role ${role.name} with id ${role.id}`);

    return role;
}

function get_degree_letter(degree_name) {
    let mapping = {
        "LEIC-A": "a",
        "LEIC-T": "t",
        "MEIC": "m"
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
    let semester = "2020/2021";
    let url = `https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${degreeId}/courses?academicTerm=${semester}`
    let courses = httpGet(url)

    let courses_order = ["FP", "IAC", "IEI", "AL", "CDI-I", "IAED", "LP", "MD", 
    "CDI-II", "SO", "PO", "ACED", "MO", "Ges", "ASA", "IPM", "TC", "EO", "PE", 
    "BD", "CG", "IA", "OC", "RC", "AMS", "Compiladores", "CS", "ES", "SD"];

    // filter out black listed courses >:(
    courses = courses.filter(course => !excludedCourses.includes(course.name));

    let res = []
    for(const course of courses) {
        let term = course.academicTerm[0]; // get the number

        if(term === '2') continue; // TODO: remove this. for the sake of time we need it here
        // PLEASE SAVE US

        let acronym = get_acronym(course.name, course.acronym);
        let academicYear = get_academic_year("-");
        let rss = `https://fenix.tecnico.ulisboa.pt/disciplinas/${course.acronym}/${academicYear}/${term}-semestre/rss/announcement`;

        res.push({
            'name': course.name,
            'acronym': acronym,
            'id': course.id,
            'term': course.academicTerm[0],
            'rss': rss
        });
    }

    if(degreeId == "2761663971475"){
        res = res.sort(function(a,b){
            return a.name.localeCompare(b.name);
        });
    }

    else{
        res = res.sort(function(a,b){
            return courses_order.indexOf(a.acronym) - courses_order.indexOf(b.acronym);
        });
    }
    return res;
}

function get_acronym(name, acronym) {
    // TODO: check this
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
        "Análise e Integração de Dados": "AID",
        "Aprendizagem": "Aprendizagem",
        "Desenvolvimento de Aplicações Distribuídas": "DAD",
        "Design de Jogos": "DJ",
        "Fundamentos de Sistemas de Informação": "FSI",
        "Planeamento, Aprendizagem e Decisão Inteligente": "PADI",
        "Segurança em Software": "SSof",
        "Linguagens de Programação": "LingP",
        "Dissertação - Mestrado em Engenharia Informática e de Computadores": "Dissert",
        "Projecto de Mestrado em Engenharia Informática e de Computadores": "ProjTese"
    }

    if(name in customAcronyms) {
        return customAcronyms[name];
    } else {
	// not recognizing BioInf because of UTF-8 character (maybe?)
	let s = name.split(" ")
	if(s[2] === "Biologia" && s[3] === "Computacional") {
	    return "BioInf";
	}
        return acronym.replace(/[\s0-9a-z\.]/g, ''); // remove lowercase and digits
    }
}

function get_academic_year(separator) {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    let baseYear = month>=8 ? year : year-1;
    return `${baseYear}${separator}${baseYear+1}`;
}


function httpGet(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false ); // false for synchronous request
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
}

async function send_message(content, channel){
    let message = await channel.send(`[${content}]`);
    return message;
}

async function send_subscription_message(title, url, description, color, channel){
    let message = await send_embeded_message(title, url, description, color, channel);
    message.react(roleSelectionEmoji);
    console.log(`[+] Sent subscription message for ${title} to ${channel.name}`);
    return message;
}

async function send_embeded_message(title, url, description, color, channel){
    let embedMessage = await new Discord.MessageEmbed()
        .setTitle(title)
        .setURL(url)
        .setDescription(description)
        .setColor(color);
    let message = await channel.send(embedMessage);
    return message;
}

async function create_staff_section(serverGuild, everyoneRoleId){
    // Generate section Staff

    console.log(`[+] Creating the Staff Section`)
    let staffCategory = await create_channel(serverGuild, '🔑Staff', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    puppetMaster = await create_channel(serverGuild, 'puppet-master', {
        'type': 'text',
        'parent': staffCategory.id
    });

    await create_channel(serverGuild, 'testing', {
        'type': 'text',
        'parent': staffCategory.id,
    });

    await create_channel(serverGuild, 'dev', {
        'type': 'text',
        'parent': staffCategory.id,
    });

    await create_channel(serverGuild, 'genesis', {
        'type': 'text',
        'parent': staffCategory.id,
    });

    await create_channel(serverGuild, 'admin-voice', {
        'type': 'voice',
        'parent': staffCategory.id,
    });
}

async function create_RNL_section(serverGuild, authenticatedID, everyoneRoleId){
    // Generate section Staff

    console.log(`[+] Creating the RNL Section`)

    let permArray = [
        Permissions.FLAGS.ADD_REACTIONS,
        Permissions.FLAGS.PRIORITY_SPEAKER,
        Permissions.FLAGS.STREAM,
        Permissions.FLAGS.VIEW_CHANNEL,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.SEND_TTS_MESSAGES,
        Permissions.FLAGS.EMBED_LINKS,
        Permissions.FLAGS.ATTACH_FILES,
        Permissions.FLAGS.READ_MESSAGE_HISTORY,
        Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.SPEAK
    ];

    let rnlCategory = await create_channel(serverGuild, '🏢RNL', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ]),
            generate_permissions(degreeRoles[0].id, [
                permArray
            ]),
            generate_permissions(degreeRoles[1].id, [
                permArray
            ]),
            generate_permissions(degreeRoles[2].id, [
                permArray
            ]),
        ]
    });
    
    await create_channel(serverGuild, '💻 Lab 15', {
        'type': 'voice',
        'parent': rnlCategory.id
    });

    await create_channel(serverGuild, '💻 Lab 16', {
        'type': 'voice',
        'parent': rnlCategory.id,
    });

    await create_channel(serverGuild, '☕ Maquinas', {
        'type': 'voice',
        'parent': rnlCategory.id,
    });
}

async function create_Arco_section(serverGuild, authenticatedID, everyoneRoleId){
    console.log(`[+] Creating the Arco Section`);

    let permArray = [
        Permissions.FLAGS.ADD_REACTIONS,
        Permissions.FLAGS.STREAM,
        Permissions.FLAGS.VIEW_CHANNEL,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.SEND_TTS_MESSAGES,
        Permissions.FLAGS.EMBED_LINKS,
        Permissions.FLAGS.ATTACH_FILES,
        Permissions.FLAGS.READ_MESSAGE_HISTORY,
        Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.SPEAK
    ];

    let permArray2 = [
        Permissions.FLAGS.ADD_REACTIONS,
        Permissions.FLAGS.VIEW_CHANNEL,
        Permissions.FLAGS.READ_MESSAGE_HISTORY
    ]

    let publicistRole = await create_role(serverGuild, {
        'data': {
            'name': 'pubiclist',
            'mentionable': true,
            'color': '#eb34c9'
        }
    });

    let arcoCategory = await create_channel(serverGuild, '🌳Arco', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ]),
            generate_permissions(degreeRoles[0].id, [
                permArray
            ]),
            generate_permissions(degreeRoles[1].id, [
                permArray
            ]),
            generate_permissions(degreeRoles[2].id, [
                permArray
            ]),
        ]
    });

    await create_channel(serverGuild, '📺anúncios-gerais', {
        'type': 'text',
        'parent': arcoCategory.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ]),
            generate_permissions(degreeRoles[0].id, [
                permArray2
            ]),
            generate_permissions(degreeRoles[1].id, [
                permArray2
            ]),
            generate_permissions(degreeRoles[2].id, [
                permArray2
            ]),
            generate_permissions(publicistRole.id, [
                permArray
            ]),
        ]

    });

    await create_channel(serverGuild, '💥geral', {
        'type': 'text',
        'parent': arcoCategory.id
    });

    await create_channel(serverGuild, '🪑code', {
        'type': 'text',
        'parent': arcoCategory.id
    });

    await create_channel(serverGuild, '🎮jogos', {
        'type': 'text',
        'parent': arcoCategory.id
    });

    await create_channel(serverGuild, '🎧música', {
        'type': 'text',
        'parent': arcoCategory.id
    });
    
    await create_channel(serverGuild, '⚽desporto', {
        'type': 'text',
        'parent': arcoCategory.id
    }); 

    await create_channel(serverGuild, '🎬cinema', {
        'type': 'text',
        'parent': arcoCategory.id
    });
    
    await create_channel(serverGuild, '👒anime', {
        'type': 'text',
        'parent': arcoCategory.id
    }); 
    
    await create_channel(serverGuild, '🤣humorleic', {
        'type': 'text',
        'parent': arcoCategory.id
    });
    
    return arcoCategory;
}

async function create_student_group_section(serverGuild, name, emote, color, authenticatedID, everyoneRoleId){
    let role = await create_role(serverGuild, {
        'data': {
            'name': name,
            'color': color,
            'mentionable': true
        }
    });

    console.log(`[+] Creating the ${name} Section`)

    let category = await create_channel(serverGuild, `${emote}${name}`, {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ]),
            generate_permissions(role.id, [
                Permissions.FLAGS.CREATE_INSTANT_INVITE,
                Permissions.FLAGS.MANAGE_CHANNELS,
                Permissions.FLAGS.ADD_REACTIONS,
                Permissions.FLAGS.VIEW_AUDIT_LOG,
                Permissions.FLAGS.PRIORITY_SPEAKER,
                Permissions.FLAGS.STREAM,
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.SEND_TTS_MESSAGES,
                Permissions.FLAGS.MANAGE_MESSAGES,
                Permissions.FLAGS.EMBED_LINKS,
                Permissions.FLAGS.ATTACH_FILES,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                Permissions.FLAGS.MENTION_EVERYONE,
                Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
                Permissions.FLAGS.CONNECT,
                Permissions.FLAGS.SPEAK,
                Permissions.FLAGS.MUTE_MEMBERS,
                Permissions.FLAGS.DEAFEN_MEMBERS,
                Permissions.FLAGS.MOVE_MEMBERS,
                Permissions.FLAGS.USE_VAD,
                Permissions.FLAGS.MANAGE_WEBHOOKS,
                Permissions.FLAGS.MANAGE_ROLES,
                Permissions.FLAGS.MANAGE_EMOJIS
            ]),
        ]
    });
    
    await create_channel(serverGuild, 'announcements', {
        'type': 'text',
        'parent': category.id,
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ]),
            generate_permissions(authenticatedID, [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                Permissions.FLAGS.ADD_REACTIONS
            ])
        ]
    });

    await create_channel(serverGuild, 'Discussion', {
        'type': 'text',
        'parent': category.id,
    });

    await create_channel(serverGuild, 'Private', {
        'type': 'voice',
        'parent': category.id,
    });
}


async function send_initial_messages(rulesText, welcomeText, degreeText, yearText, faqtext, staffRole, everyoneRoleId, authenticatedID){
    // Send welcome message
    let messageENG = await send_embeded_message(
        'Welcome to [LM]EIC’s official Discord! ',
        null,
        `This Discord Server is a collaborative effort to create a community and allow it to interact freely. \
        To allow this we can assure you this server is exclusive to **students**. We created discussion and annoucement \
        channels for each course, as well as channels that keep you informed about every activity our degrees have to offer!\n\n\
        **Instructions**\n\n\
        **0** Prove you belong here by identifying yourself in this [**LINK**](https://leic-hub.rnl.tecnico.ulisboa.pt). Only afterwards will you\
        be granted access to our server. When you do, react to this message with ✋.\n\n\
        **0.75.** Read the <#${rulesText.id}> (below).\n\n\
        **1.** Sign up in your correct degree in <#${degreeText.id}>, in the courses you're taking #enroll-<degree> and in your year <#${yearText.id}>, \
        reacting with ✋ to the appropriate message.\n\n\
        **2.** Any additional doubts check <#${faqtext.id}>\n\n`,
        '#009de0',
        welcomeText
    );

    messageENG.react(roleSelectionEmoji);
    db.insertRoleMessage(authenticatedID.id, messageENG.id);

	/*
    let messagePT = await send_embeded_message(
        'Bem-vindo ao Discord oficial de [LM]EIC! (Português)',
        null,
        `Este Discord é um esforço coletivo para criar a nossa comunidade e permitir que ela interaja livremente. Para tal asseguramos \ 
        que este servidor é exclusivo para os **estudantes** do nosso curso. Aqui existem canais de discussão e de anúncios para cada \ 
        cadeira, bem como canais que te vão manter informado sobre tudo o que se passa no nosso curso!\n\n\
        **Instruções**\n\n\
        **0.** Lê o canal de <#${rulesText.id}> (em baixo).\n\n\
        **0.75.** Prova que pertences aqui fazendo a [tua autenticação](https://leic-hub.rnl.tecnico.ulisboa.pt). Só assim terás acesso ao \
        conteúdo do servidor. Quando o fizeres, reage a esta mensagem com ✋.\n\n\
        **1.** Inscreve-te no curso correcto no canal <#${degreeText.id}>, nas cadeiras que estás a fazer #enroll-<<degree> e no teu <#${yearText.id}>, \
        reagindo com ✋ à mensagem apropriada.\n\n\
        **2.** Qualquer dúvida adicional consulta <#${faqtext.id}>\n\n`, 
        '#009de0',
        welcomeText
    );

    messagePT.react(roleSelectionEmoji);
    db.insertRoleMessage(authenticatedID.id, messagePT.id);
    */
    console.log(`[+] Sent welcome messages`);


    // Send rules message
    await send_embeded_message(
        'Rules',
        null,
        `**0.** Be respectful and mindful of others, both in tone and in content.\n\n\ 
        **0.75** Respect the Staff and their decisions, we're doing our very best.\ 
        If you need the Staff to help you with something, <@&${staffRole.id}> or a DM will do (don’t spam this).\n\n\
        **1.** Avoid using general mentions (<@&${everyoneRoleId}>/…)\n\n\
        **2.** To keep things organized, keep your discussions in the appropriate channels.\n\n\
        **3.** Change your nickname to something recognizable (e.g <firstname> <lastname>)\n\n\
        **4.** Enjoy your stay! :)\n\n`,
        '#009de0',
        rulesText
    );

	/*
    await send_embeded_message(
        'Regras (Português)',
        null,
        `**0.** Respeita os teus colegas, tanto na forma de falar como no que dizes.\n\n\ 
        **0.75** Respeita o Staff e as suas decisões, estamos a dar o nosso melhor.\ 
        Se surgir alguma questão/sugestão faz um <@&${staffRole.id}> ou manda uma DM (não spamem pls)\n\n\
        **1.** Evita usar os mentions gerais (<@&${everyoneRoleId}>/…)\n\n\
        **2.** Para manter as coisas organizadas, mantém as conversas nos canais apropriados\n\n\
        **3.** Muda o teu nome para algo reconhecível (<primeiro> <último>)\n\n\
        **4.** Enjoy your stay! :)\n\n`,
        '#009de0',
        rulesText
    ); 
    */
    console.log(`[+] Sent rules messages`);
}

async function send_year_messages(yeartext, categoryID, serverGuild, everyoneRoleId, authenticatedID){
    let years = ['15-16', '16-17', '17-18', '18-19', '19-20', '20-21']

    // Send messages
    await send_embeded_message(
        'Sign up in your degree year!',
        null,
        `This channel was created only for you to gain access to your year role. These roles are mutually exclusive \
        so you can only sign up in one.\n\n\ 
        Use ✋ to sign up in your correct entry year\n\n`,
        '#009de0',
        yeartext
    );

    await send_embeded_message(
        'Alameda Years',
        null,
        ``,
        '#ff5c5c',
        yeartext
    );

    for(const year of years){
        let yearRole = await create_role(serverGuild, {
            'data': {
                'name': `Alameda-${year}`,
                'mentionable': true,
                'color': '#ff5c5c'
            }
        });

        await create_channel(serverGuild, `🏛alameda-${year}`, {
            'type': 'text',
            'parent': categoryID,
            'permissionOverwrites': [
                generate_permissions(yearRole.id, [
                    Permissions.FLAGS.VIEW_CHANNEL,
                    Permissions.FLAGS.READ_MESSAGE_HISTORY,
                    Permissions.FLAGS.ADD_REACTIONS,
                    Permissions.FLAGS.SEND_MESSAGES,
                    Permissions.FLAGS.SEND_TTS_MESSAGES,
                    Permissions.FLAGS.EMBED_LINKS,
                    Permissions.FLAGS.ATTACH_FILES,
                    Permissions.FLAGS.USE_EXTERNAL_EMOJIS
                ]),
                generate_permissions(everyoneRoleId, [
                ])
            ]
        });

        let message = await send_subscription_message(
            `[${yearRole.name}] Enroll in this year`,
            null,
            ``,
            '#ff5c5c',
            yeartext);
        
        db.insertRoleMessage(yearRole.id, message.id);
    }

    await send_embeded_message(
        'Tagus Years',
        null,
        ``,
        '#50a156',
        yeartext
    );

    for(const year of years){
        let yearRole = await create_role(serverGuild, {
            'data': {
                'name': `Tagus-${year}`,
                'mentionable': true,
                'color': '#50a156'
            }
        });

        await create_channel(serverGuild, `🏢tagus-${year}`, {
            'type': 'text',
            'parent': categoryID,
            'permissionOverwrites': [
                generate_permissions(yearRole.id, [
                    Permissions.FLAGS.VIEW_CHANNEL,
                    Permissions.FLAGS.READ_MESSAGE_HISTORY,
                    Permissions.FLAGS.ADD_REACTIONS,
                    Permissions.FLAGS.SEND_MESSAGES,
                    Permissions.FLAGS.SEND_TTS_MESSAGES,
                    Permissions.FLAGS.EMBED_LINKS,
                    Permissions.FLAGS.ATTACH_FILES,
                    Permissions.FLAGS.USE_EXTERNAL_EMOJIS
                ]),
                generate_permissions(everyoneRoleId, [
                ])
            ]
        });

        let message = await send_subscription_message(
            `[${yearRole.name}] Enroll in this year`,
            null,
            ``,
            '#50a156',
            yeartext);

        db.insertRoleMessage(yearRole.id, message.id);
    }
    console.log(`[+] Sent year messages`);
}

async function send_study_messages(studyText, serverGuild){
    await send_embeded_message(
        'Eden Box',
        null,
        `https://www.edenbox.org/\n\n`,
        '#009de0',
        studyText
    );
}

module.exports.create_channel = create_channel;
module.exports.setup_server = setup_server;
