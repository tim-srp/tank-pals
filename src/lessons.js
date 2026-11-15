// Lessons: Chinese (most), math and English for grades 1–2, plus some everyday knowledge.
// Every level has one lesson. Each robot carries one item; the top bar asks a question,
// and the robot with the right item is the one to put to sleep (a rainbow bonus).
// Worlds 1–5 roughly follow grade 1, worlds 6–10 grade 2.
'use strict';
(function (root) {
  const STORY = root.STORY || (typeof require !== 'undefined' ? require('./story.js') : null);
  const cn = STORY.chineseNumber;

  // ---------- 语文 data ----------
  // [字, 拼音, 词, 提示图]
  const CHARS = {
    w1: [['山', 'shān', '高山', '⛰️'], ['水', 'shuǐ', '河水', '💧'], ['火', 'huǒ', '大火', '🔥']],
    w2: [['日', 'rì', '日出', '☀️'], ['月', 'yuè', '月亮', '🌙'], ['木', 'mù', '木头', '🪵'], ['禾', 'hé', '禾苗', '🌾']],
    w3: [['口', 'kǒu', '张口', '👄'], ['耳', 'ěr', '耳朵', '👂'], ['目', 'mù', '目光', '👁️'], ['手', 'shǒu', '小手', '✋']],
    w4: [['云', 'yún', '白云', '☁️'], ['雨', 'yǔ', '下雨', '🌧️'], ['风', 'fēng', '大风', '🌬️'], ['雪', 'xuě', '雪花', '❄️']],
    w5: [['春', 'chūn', '春天', '🌸'], ['夏', 'xià', '夏天', '🍉'], ['秋', 'qiū', '秋天', '🍂'], ['冬', 'dōng', '冬天', '⛄']],
    w6: [['爸', 'bà', '爸爸', '👨'], ['妈', 'mā', '妈妈', '👩'], ['哥', 'gē', '哥哥', '👦'], ['姐', 'jiě', '姐姐', '👧'], ['弟', 'dì', '弟弟', '👶']],
    w7: [['上', 'shàng', '上面', '⬆️'], ['下', 'xià', '下面', '⬇️'], ['左', 'zuǒ', '左手', '⬅️'], ['右', 'yòu', '右手', '➡️'], ['中', 'zhōng', '中间', '⏺️']],
    w8: [['猫', 'māo', '小猫', '🐱'], ['狗', 'gǒu', '小狗', '🐶'], ['鸟', 'niǎo', '小鸟', '🐦'], ['鱼', 'yú', '金鱼', '🐟'], ['虫', 'chóng', '虫子', '🐛']],
    w9: [['星', 'xīng', '星星', '⭐'], ['灯', 'dēng', '电灯', '💡'], ['门', 'mén', '大门', '🚪'], ['窗', 'chuāng', '窗户', '🪟'], ['家', 'jiā', '回家', '🏠']],
    w10: [['清', 'qīng', '清水', '💧'], ['晴', 'qíng', '晴天', '☀️'], ['睛', 'jīng', '眼睛', '👀'], ['情', 'qíng', '心情', '❤️'], ['请', 'qǐng', '请坐', '🙏']],
  };
  // Second set of characters for stage 3 in grade-2 worlds.
  const CHARS2 = {
    w6: [['眼', 'yǎn', '眼睛', '👀'], ['头', 'tóu', '头发', '🙂'], ['脚', 'jiǎo', '小脚', '🦶'], ['牙', 'yá', '牙齿', '🦷'], ['鼻', 'bí', '鼻子', '👃']],
    w7: [['笔', 'bǐ', '铅笔', '✏️'], ['书', 'shū', '书本', '📖'], ['尺', 'chǐ', '尺子', '📏'], ['本', 'běn', '本子', '📒'], ['包', 'bāo', '书包', '🎒']],
    w8: [['红', 'hóng', '红色', '🔴'], ['黄', 'huáng', '黄色', '🟡'], ['蓝', 'lán', '蓝色', '🔵'], ['绿', 'lǜ', '绿色', '🟢'], ['白', 'bái', '白色', '⚪']],
    w9: [['唱', 'chàng', '唱歌', '🎤'], ['跳', 'tiào', '跳舞', '💃'], ['跑', 'pǎo', '跑步', '🏃'], ['走', 'zǒu', '走路', '🚶'], ['坐', 'zuò', '坐下', '🪑']],
    w10: [['哭', 'kū', '哭了', '😢'], ['笑', 'xiào', '笑了', '😄'], ['看', 'kàn', '看书', '📖'], ['听', 'tīng', '听歌', '🎧'], ['说', 'shuō', '说话', '🗣️']],
  };
  // Pinyin practice (grade 1): the question shows a character, robots carry pinyin.
  const PINYIN = {
    w1: [['爸', 'bà', '爸爸', '👨'], ['妈', 'mā', '妈妈', '👩'], ['大', 'dà', '大象', '🐘']],
    w2: [['鱼', 'yú', '小鱼', '🐟'], ['牛', 'niú', '牛奶', '🐮'], ['马', 'mǎ', '小马', '🐴'], ['羊', 'yáng', '小羊', '🐑']],
    w3: [['花', 'huā', '花朵', '🌸'], ['草', 'cǎo', '小草', '🌿'], ['树', 'shù', '大树', '🌳'], ['叶', 'yè', '树叶', '🍃']],
    w4: [['米', 'mǐ', '大米', '🍚'], ['面', 'miàn', '面条', '🍜'], ['蛋', 'dàn', '鸡蛋', '🥚'], ['奶', 'nǎi', '牛奶', '🥛']],
    w5: [['车', 'chē', '汽车', '🚗'], ['船', 'chuán', '小船', '⛵'], ['飞', 'fēi', '飞机', '✈️'], ['桥', 'qiáo', '大桥', '🌉']],
  };
  // [反义词题, 答案]
  const ANTONYMS = {
    w1: [['大', '小'], ['多', '少'], ['上', '下']],
    w4: [['高', '矮'], ['长', '短'], ['快', '慢'], ['热', '冷']],
    w7: [['白', '黑'], ['笑', '哭'], ['后', '前'], ['入', '出'], ['关', '开']],
    w10: [['左', '右'], ['近', '远'], ['重', '轻'], ['新', '旧'], ['晚', '早'], ['好', '坏']],
  };
  // [量词, 名词, 图]
  const MEASURES = {
    w2: [['本', '书', '📖'], ['条', '鱼', '🐟'], ['朵', '花', '🌸']],
    w5: [['头', '牛', '🐮'], ['棵', '树', '🌳'], ['辆', '车', '🚗'], ['把', '伞', '☂️']],
    w8: [['张', '纸', '📄'], ['双', '鞋', '👟'], ['座', '山', '⛰️'], ['匹', '马', '🐴'], ['架', '飞机', '✈️']],
  };
  // 组词: [前面的字, 答案, 图]  e.g. 火 + 车 = 火车
  const WORDS = {
    w3: [['火', '车', '🚂'], ['飞', '机', '✈️'], ['雨', '伞', '☂️'], ['书', '包', '🎒']],
    w6: [['苹', '果', '🍎'], ['西', '瓜', '🍉'], ['香', '蕉', '🍌'], ['葡', '萄', '🍇'], ['草', '莓', '🍓']],
    w9: [['动物', '园', '🦁'], ['学', '校', '🏫'], ['汽', '车', '🚗'], ['手', '机', '📱'], ['冰', '箱', '🧊']],
  };
  // Stage 8 in odd worlds: more Chinese.
  const RADICALS = [['河', '三点水', '氵', '💧'], ['打', '提手旁', '扌', '✋'], ['吃', '口字旁', '口', '👄'], ['妈', '女字旁', '女', '👩']];
  const LOOKALIKE = [['人', 'rén', '人们', '🧍'], ['入', 'rù', '进入', '🚪'], ['八', 'bā', '八个', '8️⃣'], ['大', 'dà', '大象', '🐘'], ['天', 'tiān', '天空', '🌤️']];
  const NUMERALS = [['一', 'yī', '一个', '1️⃣'], ['二', 'èr', '二月', '2️⃣'], ['三', 'sān', '三只', '3️⃣'], ['十', 'shí', '十个', '🔟']];
  const SYNONYMS = [['漂亮', '美丽'], ['高兴', '快乐'], ['立刻', '马上'], ['仔细', '认真']];
  const REDUP = [['红红', '的太阳', '☀️'], ['绿绿', '的小草', '🌿'], ['白白', '的雪花', '❄️'], ['蓝蓝', '的天空', '🌌']];

  // 古诗: one poem per world; stage 5 uses line 1, the boss level line 2.
  const POEMS = [
    { title: '咏鹅', author: '骆宾王', lines: ['曲项向天歌', '白毛浮绿水'], full: '鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。' },
    { title: '画', author: '王维', lines: ['远看山有色', '近听水无声'], full: '远看山有色，近听水无声。春去花还在，人来鸟不惊。' },
    { title: '春晓', author: '孟浩然', lines: ['春眠不觉晓', '处处闻啼鸟'], full: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。' },
    { title: '静夜思', author: '李白', lines: ['床前明月光', '疑是地上霜'], full: '床前明月光，疑是地上霜。举头望明月，低头思故乡。' },
    { title: '悯农', author: '李绅', lines: ['锄禾日当午', '汗滴禾下土'], full: '锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。' },
    { title: '夜宿山寺', author: '李白', lines: ['危楼高百尺', '手可摘星辰'], full: '危楼高百尺，手可摘星辰。不敢高声语，恐惊天上人。' },
    { title: '登鹳雀楼', author: '王之涣', lines: ['白日依山尽', '黄河入海流'], full: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。' },
    { title: '梅花', author: '王安石', lines: ['墙角数枝梅', '凌寒独自开'], full: '墙角数枝梅，凌寒独自开。遥知不是雪，为有暗香来。' },
    { title: '绝句', author: '杜甫', lines: ['两个黄鹂鸣翠柳', '一行白鹭上青天'], full: '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。' },
    { title: '望庐山瀑布', author: '李白', lines: ['日照香炉生紫烟', '遥看瀑布挂前川'], full: '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。' },
  ];

  // ---------- English data ----------
  const COLORS = { red: ['红色', '#f44336'], blue: ['蓝色', '#2196f3'], yellow: ['黄色', '#fdd835'], green: ['绿色', '#43a047'], pink: ['粉色', '#f48fb1'], purple: ['紫色', '#8e24aa'], orange: ['橙色', '#fb8c00'], black: ['黑色', '#37474f'], white: ['白色', '#fafafa'], brown: ['棕色', '#8d6e63'] };
  const EN_NUMS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
  // [word, 中文, emoji]
  const EN = {
    animals: [['cat', '猫', '🐱'], ['dog', '狗', '🐶'], ['bird', '鸟', '🐦'], ['fish', '鱼', '🐟']],
    fruits: [['apple', '苹果', '🍎'], ['banana', '香蕉', '🍌'], ['orange', '橙子', '🍊'], ['pear', '梨', '🍐']],
    body: [['eye', '眼睛', '👁️'], ['ear', '耳朵', '👂'], ['nose', '鼻子', '👃'], ['mouth', '嘴巴', '👄'], ['hand', '手', '✋']],
    food: [['rice', '米饭', '🍚'], ['egg', '鸡蛋', '🥚'], ['milk', '牛奶', '🥛'], ['cake', '蛋糕', '🍰'], ['bread', '面包', '🍞']],
    nature: [['sun', '太阳', '☀️'], ['moon', '月亮', '🌙'], ['star', '星星', '⭐'], ['tree', '树', '🌳'], ['flower', '花', '🌸']],
    family: [['father', '爸爸', '👨'], ['mother', '妈妈', '👩'], ['baby', '宝宝', '👶'], ['grandpa', '爷爷', '👴'], ['grandma', '奶奶', '👵']],
    transport: [['car', '小汽车', '🚗'], ['bike', '自行车', '🚲'], ['boat', '小船', '⛵'], ['bus', '公交车', '🚌'], ['plane', '飞机', '✈️']],
    school: [['book', '书', '📖'], ['pen', '钢笔', '🖊️'], ['bag', '书包', '🎒'], ['ruler', '尺子', '📏'], ['pencil', '铅笔', '✏️']],
    zoo: [['tiger', '老虎', '🐯'], ['lion', '狮子', '🦁'], ['monkey', '猴子', '🐵'], ['panda', '熊猫', '🐼'], ['elephant', '大象', '🐘']],
    clothes: [['hat', '帽子', '👒'], ['shoe', '鞋子', '👟'], ['dress', '裙子', '👗'], ['shirt', '衬衫', '👕'], ['sock', '袜子', '🧦']],
    actions: [['run', '跑', '🏃'], ['swim', '游泳', '🏊'], ['sing', '唱歌', '🎤'], ['dance', '跳舞', '💃'], ['sleep', '睡觉', '😴']],
    feelings: [['happy', '开心', '😄'], ['sad', '难过', '😢'], ['angry', '生气', '😠'], ['tired', '累了', '😪'], ['hungry', '饿了', '🤤']],
    places: [['home', '家', '🏠'], ['school', '学校', '🏫'], ['park', '公园', '🏞️'], ['zoo', '动物园', '🦓'], ['shop', '商店', '🏪']],
  };

  // ---------- 常识 data: [题目, 答案标签, 读出来的答案] ----------
  const KNOW = {
    w2: { title: '分一分', items: [['哪个是水果？', '🍎', '苹果是水果'], ['哪个是蔬菜？', '🥕', '胡萝卜是蔬菜'], ['哪个是动物？', '🐶', '小狗是动物'], ['哪个是交通工具？', '🚗', '汽车是交通工具']] },
    w4: { title: '安全小常识', items: [['过马路要看什么？', '🚦', '过马路要看红绿灯'], ['着火了打哪个电话？', '119', '着火了打一一九'], ['有人受伤生病打哪个电话？', '120', '急救电话是一二零'], ['遇到坏人打哪个电话？', '110', '报警电话是一一零']] },
    w6: { title: '大自然', items: [['白天天上最亮的是？', '☀️', '白天最亮的是太阳'], ['毛毛虫长大会变成？', '🦋', '毛毛虫会变成蝴蝶'], ['小蝌蚪长大会变成？', '🐸', '小蝌蚪会变成青蛙'], ['小鸡的妈妈是谁？', '🐔', '小鸡的妈妈是母鸡']] },
    w8: { title: '四季', items: [['春天开满了什么？', '🌸', '春天花开了'], ['夏天吃什么最解渴？', '🍉', '夏天吃西瓜'], ['秋天树上落下什么？', '🍂', '秋天树叶落了'], ['冬天天上飘什么？', '❄️', '冬天下雪了']] },
    w10: { title: '礼貌用语', items: [['别人帮了你，要说？', '谢谢', '别人帮了你，要说谢谢'], ['不小心撞到别人，要说？', '对不起', '撞到别人要说对不起'], ['早上见到老师，要说？', '早上好', '早上见到老师说早上好'], ['别人说对不起，你可以说？', '没关系', '可以说没关系'], ['和朋友分开时，要说？', '再见', '分开时说再见']] },
  };

  // ---------- helpers ----------
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const zh = (text) => [text, 'zh'];
  const en = (text) => [text, 'en'];
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));

  // Each item: { label, cue (html for the top bar), say (spoken question, list of [text, lang]),
  //              hit (spoken when correct), name (spoken when hit while not the answer), color?, kind }
  function charLesson(set, title) {
    return {
      subject: '语文', title, kind: 'char',
      teach: `这一关认字：${set.map(c => `${c[0]}（${c[1]}）`).join('、')}。听我说，找到对的字！`,
      items: set.map(([ch, py, word, emo]) => ({
        label: ch, cue: `找字：${emo} <b>${py}</b>`, say: [zh(`找一找，${ch}，${word}的${ch}`)], hit: [zh(`${ch}，${word}的${ch}`)], name: [zh(ch)],
      })),
      recap: `认识了：${set.map(c => c[0]).join('、')}`,
    };
  }
  function pinyinLesson(set) {
    return {
      subject: '语文', title: '拼音', kind: 'pinyin',
      teach: `这一关拼一拼：${set.map(c => `${c[0]}（${c[1]}）`).join('、')}。看字，找对的拼音！`,
      items: set.map(([ch, py, word, emo]) => ({
        label: py, cue: `找拼音：${emo} <b>${ch}</b>`, say: [zh(`${word}的${ch}，拼音是哪个？`)], hit: [zh(`${ch}，${word}的${ch}`)], name: null,
      })),
      recap: `拼一拼：${set.map(c => `${c[0]} ${c[1]}`).join('，')}`,
    };
  }
  function antonymLesson(set) {
    return {
      subject: '语文', title: '反义词', kind: 'pair',
      teach: `反义词就是意思相反的词，比如“${set[0][0]}”和“${set[0][1]}”。去找反义词吧！`,
      items: set.map(([q, a]) => ({ label: a, cue: `<b>${q}</b> 的反义词？`, say: [zh(`${q}的反义词是什么？`)], hit: [zh(`${q}和${a}，意思相反`)], name: [zh(a)] })),
      recap: `反义词：${set.map(p => p.join('—')).join('，')}`,
    };
  }
  function measureLesson(set) {
    return {
      subject: '语文', title: '量词', kind: 'pair',
      teach: `我们说“一${set[0][0]}${set[0][1]}”，不说“一个${set[0][1]}”。这一关找对的量词！`,
      items: set.map(([m, n, emo]) => ({ label: m, cue: `一 <b>？</b> ${n} ${emo}`, say: [zh(`一什么${n}？`)], hit: [zh(`一${m}${n}`)], name: [zh(m)] })),
      recap: `量词：${set.map(s => `一${s[0]}${s[1]}`).join('，')}`,
    };
  }
  function wordLesson(set) {
    return {
      subject: '语文', title: '组词', kind: 'pair',
      teach: `看图组词，比如“${set[0][0]}${set[0][1]}”。找到能组成词的字！`,
      items: set.map(([a, b, emo]) => ({ label: b, cue: `${emo} <b>${a}？</b>`, say: [zh(`看图，${a}什么？`)], hit: [zh(`${a}${b}`)], name: [zh(b)] })),
      recap: `组词：${set.map(s => s[0] + s[1]).join('，')}`,
    };
  }
  function radicalLesson() {
    return {
      subject: '语文', title: '偏旁', kind: 'pair',
      teach: '字的左边常常有偏旁：三点水和水有关，提手旁和手有关。找一找！',
      items: RADICALS.map(([ch, name, r, emo]) => ({ label: ch, cue: `找有 <b>${r}</b>（${name}）的字 ${emo}`, say: [zh(`哪个字是${name}？`)], hit: [zh(`${ch}，${name}`)], name: [zh(ch)] })),
      recap: `偏旁：${RADICALS.map(r => `${r[0]}（${r[1]}）`).join('，')}`,
    };
  }
  function synonymLesson() {
    return {
      subject: '语文', title: '近义词', kind: 'pair',
      teach: '近义词就是意思差不多的词，比如“漂亮”和“美丽”。',
      items: SYNONYMS.map(([q, a]) => ({ label: a, cue: `<b>${q}</b> 的近义词？`, say: [zh(`${q}的近义词是什么？`)], hit: [zh(`${q}，${a}，意思差不多`)], name: [zh(a)] })),
      recap: `近义词：${SYNONYMS.map(p => p.join('—')).join('，')}`,
    };
  }
  function redupLesson() {
    return {
      subject: '语文', title: '词语搭配', kind: 'pair',
      teach: '红红的太阳，绿绿的小草。找到合适的词！',
      items: REDUP.map(([a, b, emo]) => ({ label: a, cue: `<b>？？</b>${b} ${emo}`, say: [zh(`什么${b}？`)], hit: [zh(`${a}${b}`)], name: [zh(a)] })),
      recap: REDUP.map(r => r[0] + r[1]).join('，'),
    };
  }
  function poemLesson(p, lineIdx) {
    const line = p.lines[lineIdx];
    return {
      subject: '语文', title: `古诗《${p.title}》`, kind: 'poem', ordered: true, inOrder: true,
      line, poem: p,
      teach: `我们来背《${p.title}》，${p.author}写的：“${line}”。按诗句的顺序，一个字一个字去找！`,
      items: [...line].map((ch, i) => ({ label: ch, idx: i, cue: '', say: null, hit: [zh(ch)], name: [zh(ch)] })),
      recap: lineIdx === 0 ? `背了《${p.title}》：${line}` : `《${p.title}》全诗：${p.full}`,
    };
  }
  function countLesson(level, english) {
    const rule = STORY.worldOf(level).rule;
    const n = 3 + Math.floor((level - 1) / 25);
    let nums;
    if (rule.kind === 'count') nums = Array.from({ length: n + 1 }, (_, i) => rule.start + i * rule.step);
    else if (rule.kind === 'countdown') nums = Array.from({ length: n + 1 }, (_, i) => n + 1 - i);
    else { const R = rng(level * 31337); const s = new Set(); while (s.size < n + 1) s.add(ri(R, 1, rule.max)); nums = [...s].sort((a, b) => a - b); }
    return {
      subject: '数学', title: english ? '用英语数数 Count' : rule.order === 'desc' ? '倒着数' : '数一数', kind: 'count', ordered: true,
      teach: english ? `用英语数数：${nums.map(enNum).join('、')}。按顺序找！` : `${rule.hint}。按顺序让机器人睡着！`,
      items: nums.map((v, i) => ({ label: String(v), idx: i, cue: `${english ? 'Count' : rule.order === 'desc' ? '倒着数' : '按顺序'}，下一个：<b>${v}</b>`, say: null, hit: [english ? en(enNum(v)) : zh(cn(v))], name: [english ? en(enNum(v)) : zh(cn(v))] })),
      recap: `数了：${nums.join('、')}`,
    };
  }
  // Arithmetic: answers are distinct; a question is made for each answer.
  function mathLesson(level, type, count, english) {
    const R = rng(level * 9173 + 11);
    const used = new Set(), items = [];
    let guard = 0;
    while (items.length < count && guard++ < 500) {
      let a, b, op, ans;
      if (type === 'add5') { ans = ri(R, 2, 5); a = ri(R, 1, ans - 1); b = ans - a; op = '+'; }
      else if (type === 'add10') { ans = ri(R, 3, 10); a = ri(R, 1, ans - 1); b = ans - a; op = '+'; }
      else if (type === 'sub10') { a = ri(R, 3, 10); b = ri(R, 1, a - 1); ans = a - b; op = '−'; }
      else if (type === 'mix10') { if (R() < 0.5) { ans = ri(R, 3, 10); a = ri(R, 1, ans - 1); b = ans - a; op = '+'; } else { a = ri(R, 3, 10); b = ri(R, 1, a - 1); ans = a - b; op = '−'; } }
      else if (type === 'add20') { a = ri(R, 2, 9); b = ri(R, 11 - a, 9); ans = a + b; op = '+'; }
      else if (type === 'sub20') { a = ri(R, 11, 18); b = ri(R, (a % 10) + 1, 9); ans = a - b; op = '−'; }
      else if (type === 'tens') { if (R() < 0.5) { a = 10 * ri(R, 1, 8); b = 10 * ri(R, 1, 9 - a / 10); ans = a + b; op = '+'; } else { a = 10 * ri(R, 3, 9); b = 10 * ri(R, 1, a / 10 - 1); ans = a - b; op = '−'; } }
      else if (type === 'mul25') { a = ri(R, 2, 5); b = ri(R, 2, 9); ans = a * b; op = '×'; }
      else if (type === 'mul69') { a = ri(R, 6, 9); b = ri(R, 2, 9); ans = a * b; op = '×'; }
      else { // two-digit add/sub without carrying, within 100
        if (R() < 0.5) { const t1 = ri(R, 1, 7), o1 = ri(R, 0, 8), t2 = ri(R, 1, 8 - t1), o2 = ri(R, 0, 9 - o1); a = t1 * 10 + o1; b = t2 * 10 + o2; ans = a + b; op = '+'; }
        else { const t1 = ri(R, 3, 9), o1 = ri(R, 1, 9), t2 = ri(R, 1, t1 - 1), o2 = ri(R, 0, o1); a = t1 * 10 + o1; b = t2 * 10 + o2; ans = a - b; op = '−'; }
      }
      if (used.has(ans)) continue;
      used.add(ans);
      const word = { '+': '加', '−': '减', '×': '乘' }[op];
      const ew = { '+': 'plus', '−': 'minus', '×': 'times' }[op];
      items.push(english
        ? { label: String(ans), cue: `<b>${a} ${op} ${b} = ？</b>`, say: [en(`${enNum(a)} ${ew} ${enNum(b)}?`)], hit: [en(`${enNum(a)} ${ew} ${enNum(b)} is ${enNum(ans)}`)], name: [en(enNum(ans))] }
        : { label: String(ans), cue: `<b>${a} ${op} ${b} = ？</b>`, say: [zh(`${cn(a)}${word}${cn(b)}等于几？`)], hit: [zh(`${cn(a)}${word}${cn(b)}等于${cn(ans)}`)], name: [zh(cn(ans))] });
    }
    const names = { add5: '5 以内加法', add10: '10 以内加法', sub10: '10 以内减法', mix10: '10 以内加减法', add20: '20 以内进位加法', sub20: '20 以内退位减法', tens: '整十数加减', mul25: '乘法口诀 2–5', mul69: '乘法口诀 6–9', two: '100 以内加减法' };
    return {
      subject: '数学', title: english ? `英语算术：${names[type]}` : names[type], kind: 'math',
      teach: english ? `这一关用英语出题：plus 是加，minus 是减，times 是乘。听题，算一算，找答案！` : `这一关做${names[type]}。先算一算，再去找头上写着答案的机器人！`,
      items, recap: `算了 ${items.length} 道${names[type]}题：${items.map(i => i.cue.replace(/<\/?b>/g, '').replace('？', i.label)).join('，')}`,
    };
  }
  function englishLesson(topic) {
    if (topic.startsWith('colors')) {
      const list = topic === 'colors1' ? ['red', 'blue', 'yellow'] : topic === 'colors2' ? ['green', 'black', 'white', 'orange'] : ['red', 'blue', 'yellow', 'green', 'pink', 'purple'];
      return {
        subject: '英语', title: '颜色 Colors', kind: 'color', lang: 'en',
        teach: `这一关学颜色：${list.map(c => `${c}（${COLORS[c][0]}）`).join('、')}。听英语，找那个颜色的机器人！`,
        items: list.map(c => ({ label: '', color: COLORS[c][1], cue: `Find <b>${c}</b>`, say: [en(c)], hit: [en(c), zh(COLORS[c][0])], name: [en(c)] })),
        recap: `学会了：${list.join('、')}`,
      };
    }
    if (topic.startsWith('nums')) {
      const range = { nums1: [1, 3], nums2: [4, 7], nums3: [8, 10], nums4: [11, 15] }[topic];
      const list = []; for (let n = range[0]; n <= range[1]; n++) list.push(n);
      return {
        subject: '英语', title: '数字 Numbers', kind: 'en',
        teach: `这一关学英语数字：${list.map(n => `${EN_NUMS[n]}（${n}）`).join('、')}。`,
        items: list.map(n => ({ label: String(n), cue: `Find <b>${EN_NUMS[n]}</b>`, say: [en(EN_NUMS[n])], hit: [en(EN_NUMS[n]), zh(cn(n))], name: [en(EN_NUMS[n])] })),
        recap: `学会了：${list.map(n => EN_NUMS[n]).join('、')}`,
      };
    }
    const set = EN[topic];
    return {
      subject: '英语', title: 'English', kind: 'en',
      teach: `这一关学英语：${set.map(w => `${w[0]}（${w[1]}）`).join('、')}。听单词，找对的图！`,
      items: set.map(([w, c, emo]) => ({ label: emo, cue: `Find <b>${w}</b>`, say: [en(w)], hit: [en(w), zh(c)], name: [en(w)] })),
      recap: `学会了：${set.map(w => w[0]).join('、')}`,
    };
  }
  function knowLesson(k) {
    return {
      subject: '常识', title: k.title, kind: 'know',
      teach: `这一关是“${k.title}”。听问题，找对的答案！`,
      items: k.items.map(([q, a, said]) => ({ label: a, cue: `<b>${q}</b>`, say: [zh(q)], hit: [zh(said)], name: /^\d+$/.test(a) ? [zh([...a].map(d => '零一二三四五六七八九'[d]).join(''))] : /\p{Extended_Pictographic}/u.test(a) ? null : [zh(a)] })),
      recap: k.items.map(i => i[2]).join('；'),
    };
  }

  // ---------- English curriculum (from zero) ----------
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function enNum(n) { if (n < 20) return ONES[n]; if (n === 100) return 'one hundred'; return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }

  // [word, 中文, picture, type]   type: n noun, c colour, a adjective, v action, f feeling, num number
  const EW = [
    { A: [['cat', '猫', '🐱', 'n'], ['dog', '狗', '🐶', 'n'], ['bird', '鸟', '🐦', 'n'], ['fish', '鱼', '🐟', 'n']],
      B: [['red', '红色', '🟥', 'c'], ['blue', '蓝色', '🟦', 'c'], ['yellow', '黄色', '🟨', 'c'], ['green', '绿色', '🟩', 'c']], letters: 'ABCD' },
    { A: [['cow', '奶牛', '🐮', 'n'], ['pig', '猪', '🐷', 'n'], ['duck', '鸭子', '🦆', 'n'], ['sheep', '羊', '🐑', 'n']],
      B: [['apple', '苹果', '🍎', 'n'], ['banana', '香蕉', '🍌', 'n'], ['orange', '橙子', '🍊', 'n'], ['grape', '葡萄', '🍇', 'n']], letters: 'EFGH' },
    { A: [['one', '一', '1', 'num'], ['two', '二', '2', 'num'], ['three', '三', '3', 'num'], ['four', '四', '4', 'num'], ['five', '五', '5', 'num']],
      B: [['eye', '眼睛', '👁️', 'n'], ['ear', '耳朵', '👂', 'n'], ['nose', '鼻子', '👃', 'n'], ['mouth', '嘴巴', '👄', 'n']], letters: 'IJKL' },
    { A: [['six', '六', '6', 'num'], ['seven', '七', '7', 'num'], ['eight', '八', '8', 'num'], ['nine', '九', '9', 'num'], ['ten', '十', '10', 'num']],
      B: [['mom', '妈妈', '👩', 'n'], ['dad', '爸爸', '👨', 'n'], ['baby', '宝宝', '👶', 'n'], ['grandma', '奶奶', '👵', 'n']], letters: 'MNOP' },
    { A: [['sun', '太阳', '☀️', 'n'], ['moon', '月亮', '🌙', 'n'], ['star', '星星', '⭐', 'n'], ['tree', '树', '🌳', 'n']],
      B: [['hat', '帽子', '👒', 'n'], ['shoe', '鞋子', '👟', 'n'], ['sock', '袜子', '🧦', 'n'], ['coat', '外套', '🧥', 'n']], letters: 'QRST' },
    { A: [['tiger', '老虎', '🐯', 'n'], ['lion', '狮子', '🦁', 'n'], ['monkey', '猴子', '🐵', 'n'], ['panda', '熊猫', '🐼', 'n']],
      B: [['rice', '米饭', '🍚', 'n'], ['egg', '鸡蛋', '🥚', 'n'], ['milk', '牛奶', '🥛', 'n'], ['cake', '蛋糕', '🍰', 'n']], letters: 'UVWXYZ' },
    { A: [['run', '跑', '🏃', 'v'], ['jump', '跳', '🤸', 'v'], ['swim', '游泳', '🏊', 'v'], ['sing', '唱歌', '🎤', 'v']],
      B: [['happy', '开心', '😄', 'f'], ['sad', '难过', '😢', 'f'], ['hot', '热', '🥵', 'f'], ['cold', '冷', '🥶', 'f']], phonics: 'start' },
    { A: [['book', '书', '📖', 'n'], ['pen', '钢笔', '🖊️', 'n'], ['bag', '书包', '🎒', 'n'], ['ruler', '尺子', '📏', 'n']],
      B: [['ball', '球', '⚽', 'n'], ['kite', '风筝', '🪁', 'n'], ['car', '小汽车', '🚗', 'n'], ['robot', '机器人', '🤖', 'n']], phonics: 'case' },
    { A: [['bus', '公交车', '🚌', 'n'], ['bike', '自行车', '🚲', 'n'], ['boat', '小船', '⛵', 'n'], ['plane', '飞机', '✈️', 'n']],
      B: [['home', '家', '🏠', 'n'], ['school', '学校', '🏫', 'n'], ['park', '公园', '🏞️', 'n'], ['shop', '商店', '🏪', 'n']], phonics: 'spell1' },
    { A: [['big', '大', '🐘', 'a'], ['small', '小', '🐭', 'a'], ['tall', '高', '🦒', 'a'], ['fast', '快', '🐆', 'a']],
      B: [['pink', '粉色', '🩷', 'c'], ['purple', '紫色', '🟪', 'c'], ['black', '黑色', '⬛', 'c'], ['white', '白色', '⬜', 'c']], phonics: 'spell2' },
  ];
  const COLOR_HEX = { red: '#f44336', blue: '#2196f3', yellow: '#fdd835', green: '#43a047', pink: '#f48fb1', purple: '#8e24aa', black: '#37474f', white: '#fafafa' };
  const LETTER_WORDS = { A: ['apple', '🍎'], B: ['bird', '🐦'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'], F: ['fish', '🐟'], G: ['grape', '🍇'], H: ['hat', '👒'], I: ['ice cream', '🍦'], J: ['jump', '🤸'], K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nose', '👃'], O: ['orange', '🍊'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['robot', '🤖'], S: ['sun', '☀️'], T: ['tree', '🌳'], U: ['umbrella', '☂️'], V: ['van', '🚐'], W: ['water', '💧'], X: ['fox', '🦊'], Y: ['yellow', '🟨'], Z: ['zoo', '🦓'] };
  const BEE = { name: 'Bee 老师', face: '🐝' };

  const wordObj = ([w, zhv, pic, type]) => ({ w, zh: zhv, pic, type });
  // Every word the child has been taught before this level.
  function introducedBefore(level) {
    const out = [];
    for (let lv = 1; lv < level; lv++) {
      const wi = Math.floor((lv - 1) / 10), st = STORY.stageOf(lv);
      if (st === 1) out.push(...EW[wi].A.map(wordObj));
      if (st === 4) out.push(...EW[wi].B.map(wordObj));
    }
    return out;
  }
  function allWordsUpTo(level) { return introducedBefore(level + 1); }

  function article(w) { return /^[aeiou]/.test(w) ? 'an' : 'a'; }
  function sentence(o) {
    switch (o.type) {
      case 'c': return `It is ${o.w}.`;
      case 'a': return `It is ${o.w}.`;
      case 'v': return `I can ${o.w}.`;
      case 'f': return `I am ${o.w}.`;
      case 'num': return `I have ${o.w}.`;
      default: return o.w === 'home' ? "Let's go home." : o.w === 'school' ? 'I go to school.' : `I see ${article(o.w)} ${o.w}.`;
    }
  }
  // mode: 'show' (word shown + spoken, find the picture), 'listen' (spoken only), 'read' (picture shown, find the word), 'sentence'
  function englishItem(o, mode) {
    const pictureLabel = o.pic;
    const base = { word: o.w, color: mode !== 'read' && o.type === 'c' ? COLOR_HEX[o.w] : undefined, hit: [en(o.w), zh(o.zh)] };
    if (mode === 'show') return { ...base, label: pictureLabel, cue: `Find <b>${o.w}</b>`, say: [en(o.w)], name: [en(o.w)] };
    if (mode === 'listen') return { ...base, label: pictureLabel, cue: '听一听，找一找 <b>?</b>', say: [en(o.w)], name: [en(o.w)] };
    if (mode === 'read') return { ...base, label: o.w, cue: `${o.pic} <b>英语怎么说？</b>`, say: [zh(`${o.zh}，英语怎么说？`)], name: [en(o.w)] };
    const sent = sentence(o);
    return { ...base, label: pictureLabel, cue: sent.replace(o.w, `<b>${o.w}</b>`), say: [en(sent)], hit: [en(sent), zh(o.zh)], name: [en(o.w)] };
  }
  function cardsFor(words) { return words.map(o => ({ pic: o.pic, word: o.w, zh: o.zh, color: o.type === 'c' ? COLOR_HEX[o.w] : null })); }

  function newWordsLesson(words, batch) {
    return {
      subject: '英语', title: `新单词 New words ${batch}`, kind: 'en', cards: cardsFor(words),
      teacher: BEE,
      teach: `今天学 ${words.length} 个新单词：${words.map(o => o.w).join('、')}。先看卡片听一听，再去找！`,
      items: words.map(o => englishItem(o, 'show')),
      recap: `新单词：${words.map(o => `${o.w}（${o.zh}）`).join('，')}`,
    };
  }
  const MODE_NAMES = { show: '看词找图', listen: '听音找图', read: '看图认词', sentence: '听句子' };
  function practiceLesson(words, mode, title) {
    return {
      subject: '英语', title: `${title} · ${MODE_NAMES[mode]}`, kind: 'en', teacher: BEE,
      teach: {
        listen: '这一关只听不看：仔细听 Bee 老师读的单词，找对的图。没听清就点题目再听一遍！',
        read: '这一关看图认单词：看到图，找写着对应英文单词的机器人。',
        sentence: '这一关听句子：听懂句子里的单词，找对的图。',
        show: '看单词、听发音，找对的图。',
      }[mode] + ` 有：${words.map(o => o.w).join('、')}。`,
      items: words.map(o => englishItem(o, mode)),
      recap: `练习了：${words.map(o => `${o.w}（${o.zh}）`).join('，')}`,
    };
  }
  function lettersLesson(letters) {
    const cards = [...letters].map(L => ({ pic: LETTER_WORDS[L][1], word: `${L} ${L.toLowerCase()}`, zh: `${L} is for ${LETTER_WORDS[L][0]}`, letter: L }));
    return {
      subject: '英语', title: `字母 ${letters[0]}–${letters[letters.length - 1]}`, kind: 'letter', cards, teacher: BEE,
      teach: `认识字母：${[...letters].map(L => L + L.toLowerCase()).join('、')}。听字母，找字母！`,
      items: [...letters].map(L => ({ label: `${L}${L.toLowerCase()}`, cue: `Find letter <b>${L}</b>`, say: [en(L)], hit: [en(L), en(`${L} is for ${LETTER_WORDS[L][0]}`)], name: [en(L)] })),
      recap: `字母：${[...letters].map(L => L + L.toLowerCase()).join(' ')}`,
    };
  }
  function phonicsLesson(kind) {
    if (kind === 'start') {
      const set = [['B', 'bird', '🐦'], ['C', 'cat', '🐱'], ['D', 'dog', '🐶'], ['F', 'fish', '🐟'], ['P', 'pig', '🐷']];
      return {
        subject: '英语', title: '首字母 Sounds', kind: 'letter', teacher: BEE,
        teach: 'bird 是 B 开头，cat 是 C 开头。听字母，找用这个字母开头的图！',
        items: set.map(([L, w, pic]) => ({ label: pic, word: w, cue: `Which starts with <b>${L} ${L.toLowerCase()}</b>?`, say: [en(`Which word starts with ${L}?`)], hit: [en(`${w}, ${L}`)], name: [en(w)] })),
        recap: set.map(([L, w]) => `${L} — ${w}`).join('，'),
      };
    }
    if (kind === 'case') {
      const set = ['B', 'D', 'P', 'Q', 'G'];
      return {
        subject: '英语', title: '大写小写 Aa Bb', kind: 'letter', teacher: BEE,
        teach: '每个字母都有大写和小写。b、d、p、q 长得很像，要看仔细！',
        items: set.map(L => ({ label: L.toLowerCase(), cue: `Find small <b>${L}</b>`, say: [en(`Find small ${L}`)], hit: [en(`${L}, small ${L}`)], name: [en(L)] })),
        recap: set.map(L => `${L} ${L.toLowerCase()}`).join('，'),
      };
    }
    const set = kind === 'spell1'
      ? [['cat', 'c_t', 'a', '🐱'], ['dog', 'd_g', 'o', '🐶'], ['pig', 'p_g', 'i', '🐷'], ['sun', 's_n', 'u', '☀️'], ['red', 'r_d', 'e', '🟥']]
      : [['cat', '_at', 'c', '🐱'], ['dog', '_og', 'd', '🐶'], ['fish', '_ish', 'f', '🐟'], ['sun', '_un', 's', '☀️'], ['pig', '_ig', 'p', '🐷'], ['hat', '_at', 'h', '👒']];
    return {
      subject: '英语', title: '拼单词 Spelling', kind: 'letter', teacher: BEE,
      teach: '单词里少了一个字母！看图读一读，找缺的那个字母。',
      items: set.map(([w, gap, letter, pic]) => ({ label: letter, word: w, cue: `${pic} <b>${gap.replace('_', '＿')}</b>`, say: [en(`${w}. ${w}.`)], hit: [en(`${w}. ${[...w].join(' ')}`)], name: [en(letter)] })),
      recap: set.map(([w]) => w).join('，'),
    };
  }

  // Review words the child got wrong before (from saved stats), otherwise a seeded pick of older words.
  function reviewPick(level, pool, n, stats, exclude) {
    const R = rng(level * 7717 + 3);
    const used = new Set(exclude.map(o => o.pic).concat(exclude.map(o => o.w)));
    const cand = pool.filter(o => !used.has(o.pic) && !used.has(o.w));
    const score = (o) => { const s = stats && stats[o.w]; return s ? s.w * 2 - s.r : 0; };
    const weak = cand.filter(o => score(o) > 0).sort((a, b) => score(b) - score(a));
    const rest = cand.filter(o => score(o) <= 0);
    shuffle(rest, R);
    return [...weak, ...rest].slice(0, n);
  }
  function shuffle(arr, R) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

  // ---------- the plan: English first ----------
  // Each world: 1 new words A · 2 practise A · 3 认字 · 4 new words B · 5 letters/phonics
  //             6 math · 7 practise A+B (+review) · 8 古诗 · 9 math in English · 10 boss: big review
  const MATH6 = ['add5', 'add10', 'sub10', 'mix10', 'add20', 'sub20', 'tens', 'mul25', 'mul69', 'two'];
  const MATH9 = [null, null, 'count1', 'count2', 'add10', 'sub10', 'mix10', 'add20', 'sub20', 'mul25'];
  const practiseMode = (w) => (w < 2 ? 'listen' : w < 6 ? 'read' : 'sentence');

  function lessonFor(level, stats) {
    const w = Math.floor((level - 1) / STORY.LEVELS_PER_WORLD);
    const stage = STORY.stageOf(level);
    const E = EW[w], A = E.A.map(wordObj), B = E.B.map(wordObj);
    const R = rng(level * 131 + 9);
    let L;
    switch (stage) {
      case 1: L = newWordsLesson(A, 1); break;
      case 2: L = practiceLesson(shuffle(A.slice(), R), w < 2 ? 'listen' : 'read', '练一练'); break;
      case 3: L = charLesson(CHARS['w' + (w + 1)], '认字'); break;
      case 4: L = newWordsLesson(B, 2); break;
      case 5: L = E.letters ? lettersLesson(E.letters) : phonicsLesson(E.phonics); break;
      case 6: L = mathLesson(level, MATH6[w], Math.min(3 + Math.floor(w / 2), 6)); break;
      case 7: {
        const mine = [...shuffle(A.slice(), R).slice(0, 2), ...shuffle(B.slice(), R).slice(0, 2)];
        const old = reviewPick(level, introducedBefore(level).filter(o => !E.A.some(a => a[0] === o.w) && !E.B.some(b => b[0] === o.w)), 2, stats, mine);
        L = practiceLesson([...mine, ...old], practiseMode(w), '复习');
        break;
      }
      case 8: L = poemLesson(POEMS[w], 0); break;
      case 9: {
        const t = MATH9[w];
        if (!t) L = w === 0 ? countLesson(level, false) : mathLesson(level, 'add5', 3);
        else if (t === 'count1') L = countLesson(level, true);
        else if (t === 'count2') { L = countLesson(level, true); }
        else L = mathLesson(level, t, Math.min(4 + Math.floor(w / 3), 6), true);
        break;
      }
      default: {
        const mine = shuffle([...A, ...B], R).slice(0, 4);
        const old = reviewPick(level, introducedBefore(level).filter(o => ![...E.A, ...E.B].some(x => x[0] === o.w)), 2, stats, mine);
        L = practiceLesson([...mine, ...old], practiseMode(w), '大复习');
      }
    }
    L.ordered = !!L.ordered;
    return L;
  }

  const LESSONS = { lessonFor, POEMS, COLORS, allWordsUpTo, introducedBefore, enNum, BEE };
  if (typeof module !== 'undefined') module.exports = LESSONS; else root.LESSONS = LESSONS;
})(typeof window !== 'undefined' ? window : globalThis);
