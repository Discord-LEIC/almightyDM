let Discord = require("discord.js");
const { Guild, Permissions, DiscordAPIError} = require("discord.js");
let randomColor = require('randomcolor');
const config = require('./config.json');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

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
    return {
        'id': roleId,
        'type': 'role',
        'deny': permissions.filter(p => !allowed.includes(p)),
        'allow': allowed
    };
}

async function setup_server(serverGuild) {
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
                Permissions.FLAGS.READ_MESSAGE_HISTORY
            ])
        ]
    });

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

    //TODO: Send Enroll Degree messages
    let degreeText = await create_channel(serverGuild, 'enroll-degree', {
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

    announcementsCategories['LEIC-A'] = await create_channel(serverGuild, 'Announcements-A', {
        'type': 'category',
        'permissionOverwrites': [
            generate_permissions(everyoneRoleId, [
            ])
        ]
    });

    //TODO: This is very ugly
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
    let courses_db = {}

    //Sends the messages to the initial channels
    await send_initial_messages(rulesText, welcomeText, degreeText, staffRole, everyoneRoleId);

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
            randomColor(),
            degreeText);

        enrollment_mappings[message.id] = degreeRole.id.toString();

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
        console.log(`[+] Creating enrollment channel ${enrollChannelName} with id ${enrollChannel.id}`);

        console.log(`[+] Retrieving courses from ${degree.acronym}...`);
        let courses = get_courses(degree.id);
        for(const course of courses) {

            // TODO TODO: verificar se o role esta duplicado

            // TODO: generate course role
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

            // TODO: send enrollment message to enrollment channel (DONT FORGET TO REACT TO MESSAGE)
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

            // TODO: generate course channels (DONT FORGET TO SET PERMISSIONS!)
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
        }

        courses_db[degreeRoleName] = courses;
    }

    // TODO: Uncomment this
    /*
    await create_RNL_section(serverGuild, everyoneRoleId);
    await create_Arco_section(serverGuild, everyoneRoleId);
    await create_student_group_section(serverGuild, 'NEIIST', '♦️', '#f09d30', everyoneRoleId);
    await create_student_group_section(serverGuild, 'SINFO', '🔹', '#295a8a', everyoneRoleId);
    await create_student_group_section(serverGuild, 'GCE', '💼', '#00d3ff', everyoneRoleId);
    await create_student_group_section(serverGuild, 'RNL-Admin', '💻', '#000000', everyoneRoleId);
    await create_student_group_section(serverGuild, 'Praxe', '👥', '#666666', everyoneRoleId);
    */

    console.log(enrollment_mappings);
    console.log(courses_db);
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
    let semester = "2019/2020";
    let url = `https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${degreeId}/courses?academicTerm=${semester}`
    let courses = httpGet(url)

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
        "Bioinformática / Biologia Computacional": "BioInf",
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

    await create_channel(serverGuild, 'puppet-master', {
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

async function create_RNL_section(serverGuild, everyoneRoleId){
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

async function create_Arco_section(serverGuild, everyoneRoleId){
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

    let arcoCategory = await create_channel(serverGuild, '🌳RNL', {
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
}

async function create_student_group_section(serverGuild, name, emote, color, everyoneRoleId){
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
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.READ_MESSAGE_HISTORY,
                Permissions.FLAGS.ADD_REACTIONS
            ]),
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


async function send_initial_messages(rulesText, welcomeText, degreeText, staffRole, everyoneRoleId){
    // Send welcome message
    await send_embeded_message(
        'Welcome to LEIC’s official Discord [Beta]! (English)',
        null,
        `This Discord Server is a collaborative effort to allow all LEIC students to interact and engage with \
        each other in a single server. Besides interaction, this server has useful features such as discussion \
        and announcement channels for each course you are taking. The latter directly fetches all announcements \
        from Fénix and sends a notification your way.\n\n\
        **DISCLAIMER:** This Server is in Open Beta. For now, only 1st year students are present here. Sometime in the \
        future this server will suffer an update that will allow every LEIC/MEIC student to join. The structure will \
        remain the same, the only difference is that more people will be present (in the appropriate channels). Also, \
        congratulations on making it here, the hard part is yet to come.\n\n\
        Before doing anything, please carefully read the <@&${rulesText.id}> channel below.\n\n\
        **Instructions**\n\n\
        **1.** First and foremost, enroll in your correct degree in the <@&${degreeText.id}> channel. Use ✋ to \
        respond to the appropriate message. You will gain a role corresponding to your degree (LEIC-A, LEIC-T). \
        LEIC-A and LEIC-T are mutually exclusive roles.\n\n\
        **2.** This setup being complete, you should have access to every content this server has to offer. If \
        any roles get misassigned, please contact <@&${staffRole.id}>.\n\n`,
        randomColor(),
        welcomeText
    );

    await send_embeded_message(
        'Bem-vindo ao Discord oficial de LEIC [Beta]! (Português)',
        null,
        `Este Discord é um esforço coletivo para permitir a todos os alunos de LEIC interagirem e falarem uns com os outros \
        todos no mesmo servidor. Para além disso, o servidor tem funcionalidades úteis, como canais de discussão e de anúncios \
        para cada cadeira. Estes últimos permitem tirar todos os anúncios diretamente do Fénix e mandar-te uma notificação.\n\n\
        **AVISO:** Este servidor está em Open Beta. Por agora só alunos do 1º ano é que estão aqui presentes. Algures num futuro próximo \
        este servidor vai receber um update que vai permitir a todos os alunos de LEIC/MEIC juntarem-se. A estrutura ficará igual, a \
        única diferença é que estarão presentes mais pessoas (nos canais apropriados). Muitos parabéns por teres chegado até aqui, o \
        mais difícil está para vir.\n\n\
        Antes de fazeres qualquer outra coisa, lê o canal de <@&${rulesText.id}> em baixo.\n\n\
        **Instruções**\n\n\
        **1.** Primeiro que tudo, inscreve-te no curso correcto no canal <@&${degreeText.id}>. Usa ✋ para responder à mensagem apropriada. \
        Vais ganhar uma role que corresponde ao teu curso (LEIC-A, LEIC-T). LEIC-A e LEIC-T são mutuamente exclusivos.\n\n\
        **2.** Estando este passo cumprido, deves ter acesso a todos os canais que tens direito. Se alguma coisa correr mal, contacta <@&${staffRole.id}>`,
        randomColor(),
        welcomeText
    );

    console.log(`[+] Sent welcome messages`);

    // Send rules message
    await send_embeded_message(
        'Rules (English)',
        null,
        `**0.** Be respectful and mindful of others, both in tone and in content. To keep things running smoothly, \
        keep your discussions within the appropriate channels and don’t overstep personal boundaries, especially \
        when conflict may arise.\n\n\
        **1.** Change your nickname to something others can recognize as you (e.g <firstname> <lastname>)\n\n\
        **2.** Use course channel mentions (#<course name>) instead of general ones (<@&${everyoneRoleId}>/…). \
        If you need Staff to help with something, <@&${staffRole.id}> or a DM will do (don’t spam this).\n\n\
        **3.** If there are non-portuguese speakers in a channel, please use english.\n\n\
        **4.** Respect the Staff and their decisions. A lot of situations will be outside \
        the scope of these rules and so they will be constantly dealing with all sorts \
        of complicated situations\n\n\
        **5.** Enjoy your stay! :)\n\n\
        **Acronyms**\n\
        aa - Alameda announcements\n\
        ad - Alameda discussion\n\
        ta - Tagus announcements\n\
        td - Tagus announcements\n\
        ma - MEIC announcements\n\
        md - MEIC announcements\n`,
        randomColor(),
        rulesText
    );

    await send_embeded_message(
        'Regras (Português)',
        null,
        `**0.** Respeita os outros alunos, tanto na forma como falas como no que dizes. Para manter as coisas\
        organizadas, mantém as discussões nos canais apropriados e não passes por cima dos limites pessoais de\
        cada um, especialmente em eventuais discussões.\n\n\
        **1.** Muda o teu nome para algo reconhecível (<primeiro> <último>)\n\n\
        **2.** Usa os mentions para cada cadeira (#<nome da cadeira>) em vez de mentions gerais (<@&${everyoneRoleId}>/…).\
        Se precisares da ajuda de um membro do Staff, <@&${staffRole.id}> ou uma DM funciona (não spamem).\n\n\
        **3.** Se houver alguém não português num canal, falem inglês de preferência.\n\n\
        **4.** Respeita o Staff e as suas decisões. Muitas situações vão estar fora das regras aqui descritas portanto os \
        membros do Staff vão estar constantemente a servir de suporte de problemas, a resolver situações complicadas.\n\n\
        **5.** Enjoy your stay! :)\n\n\
        **Acrónimos**\n\
        aa - Alameda anúncios\n\
        ad - Alameda discussão\n\
        ta - Tagus anúncios\n\
        td - Tagus discussão\n\
        ma - MEIC anúncios\n\
        md - MEIC discussão\n`,
        randomColor(),
        rulesText
    ); 
    
    console.log(`[+] Sent rules messages`);
}

module.exports.create_channel = create_channel;
module.exports.setup_server = setup_server;

// TODO: REMOVE WHEN NOT NEEDED
/*
async function setup() {
    var courses = ["FP", "IAC", "IEI", "AL", "CDI-I", "IAED", "LP", "MD", "CDI-II", "SO", "PO", "ACED", "MO", "Ges", "ASA", "IPM", "TC", "EO", "PE", "BD", "CG", "IA", "OC", "RC", "AMS", "Compiladores", "CS", "ES", "SD"];

    var instructions = "Reage com :raised_hand: na mensagem da respetiva cadeira para teres acesso ao seu canal de discussão e receberes notificações dos anúncios dessa cadeira. Para reverter a ação, basta retirar a reação na mensagem correspondente.";
    
    let subscriptionChannel = get_channel(subscriptionChannelID);
    for(let course of courses) {
        // console.log(`[${course}]`);
        let message = await subscriptionChannel.send(`[${course}]`);
        message.react(roleSelectionEmoji);
        console.log(`${course}: ${message.id}`);
    }

    // console.log(instructions);
    subscriptionChannel.send(instructions);
    
}
*/