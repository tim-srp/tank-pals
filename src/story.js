// Story and world data. Everything a level needs to tell its little story lives here.
// Characters: 小蓝 (you, the blue tank), 扳手爷爷 (an old repair robot who guides you),
// 迷糊机器人 (robots whose sleep chips were scrambled by 乱码云's static lightning),
// 乱码云 (a grumpy, lonely cloud — the last friend you make).
'use strict';

const NARRATOR = { name: '旁白', face: '📖' };
const GRANDPA = { name: '扳手爷爷', face: '👴🔧' };
const BLUE = { name: '小蓝', face: '🚙' };
const ROBOT = { name: '机器人', face: '🤖' };
const CLOUD = { name: '乱码云', face: '🌩️' };

// Number rules: which numbers the robots carry, and in which order to hit them for the bonus.
// order 'asc' = smallest first, 'desc' = biggest first.
const WORLDS = [
  {
    name: '青草村', emoji: '🌱',
    theme: { floor: '#cdeeb0', floor2: '#c2e6a3', brick: '#e8944a', brickLine: '#b8672b', steel: '#9aa7b4', steelDark: '#6d7a88', bush: '#4caf50', bush2: '#3b9142', accent: '#ff8f3a' },
    rule: { kind: 'count', start: 1, step: 1, order: 'asc', hint: '从 1 开始，一个一个数' },
    fact: '蜜蜂会跳“8 字舞”，告诉伙伴花在哪里。',
    repairs: ['村口的小木桥', '风车的叶片', '面包店的烟囱', '小学的铃铛', '池塘边的长椅', '菜园的篱笆', '邮筒', '路灯', '秋千'],
    intro: [
      [NARRATOR, '昨晚，乱码云飘过青草村，打了一串噼里啪啦的乱码闪电。'],
      [GRANDPA, '糟糕！机器人们的睡眠芯片被弄乱了，它们迷迷糊糊地到处乱跑。'],
      [GRANDPA, '小蓝，用“晚安能量球”轻轻碰一下它们，它们就能好好睡一觉，醒来就好啦。'],
      [BLUE, '交给我吧！'],
    ],
    lines: [
      [GRANDPA, '机器人头顶有数字。按顺序 1、2、3 去碰它们，会有彩虹奖励哦！'],
      [ROBOT, '嘀……嘀……我想不起回家的路了……'],
      [GRANDPA, '砖块可以打碎，有时候里面藏着星星和爱心。'],
      [NARRATOR, '面包店的香味飘过来，可是送面包的机器人在原地转圈圈。'],
      [GRANDPA, '灰色的铁块打不碎，绕过去就好。'],
      [BLUE, '躲在草丛里，机器人就不容易看见我啦。'],
      [ROBOT, '嘀嘀！我的轮子停不下来啦！'],
      [GRANDPA, '小心它们发出的紫色能量球。被碰到会少一格护盾。'],
      [NARRATOR, '村子里的灯一盏一盏亮起来了。就快成功啦！'],
    ],
    boss: { name: '稻草人机器人', face: '🧑‍🌾', hp: 4, color: '#d9a441' },
    bossIntro: [[GRANDPA, '田里那个大块头是稻草人机器人！它被乱码闪电打得最厉害，要多碰几下才行。']],
    outro: [
      [ROBOT, '呼……睡了一大觉，舒服多了！谢谢你，小蓝！'],
      [GRANDPA, '青草村恢复平静了。可是乱码云往向日葵农场飘去了……'],
    ],
  },
  {
    name: '向日葵农场', emoji: '🌻',
    theme: { floor: '#f6e7a8', floor2: '#efdc92', brick: '#d9773a', brickLine: '#a6542a', steel: '#a3a8ad', steelDark: '#737a80', bush: '#7cb342', bush2: '#5f9431', accent: '#ffc107' },
    rule: { kind: 'count', start: 1, step: 1, order: 'asc', hint: '从 1 开始，一个一个数' },
    fact: '小向日葵会跟着太阳转头，长大后就一直朝着东边。',
    repairs: ['鸡舍的门', '拖拉机的喇叭', '牛奶车', '谷仓的屋顶', '浇水的水管', '稻草人的帽子', '蜂箱', '果园的梯子', '风向标'],
    intro: [
      [NARRATOR, '小蓝来到向日葵农场。金黄的花海里，传来“嘀嘀嘀”的乱叫声。'],
      [GRANDPA, '农场的机器人负责浇水、喂鸡、摘苹果。现在它们全乱套了！'],
    ],
    lines: [
      [ROBOT, '嘀！我把牛奶倒进鸡窝里了……'],
      [NARRATOR, '小鸡们“叽叽叽”地跟在小蓝后面，好像在给它加油。'],
      [GRANDPA, '还记得吗？按 1、2、3 的顺序，会有彩虹奖励。'],
      [BLUE, '向日葵都朝着太阳，我也要勇敢向前！'],
      [ROBOT, '我是摘苹果的，可我把南瓜摘下来了……'],
      [NARRATOR, '一阵风吹过，花海哗啦啦地响。'],
      [GRANDPA, '你越来越熟练了，小蓝。'],
      [ROBOT, '嘀嘀……我想浇水，可是水管打结了。'],
      [NARRATOR, '谷仓那边传来轰隆隆的声音……'],
    ],
    boss: { name: '拖拉机机器人', face: '🚜', hp: 5, color: '#e05a3a' },
    bossIntro: [[GRANDPA, '是拖拉机机器人！它力气很大，会撞碎砖块，小心躲开。']],
    outro: [
      [ROBOT, '轰隆隆……哦，我刚才在干嘛？谢谢你叫醒我！'],
      [GRANDPA, '农场又开始干活了。听说沙漠绿洲也出事了，我们出发吧！'],
    ],
  },
  {
    name: '沙漠绿洲', emoji: '🐫',
    theme: { floor: '#f3d9a4', floor2: '#ebcd91', brick: '#c98a4b', brickLine: '#94622f', steel: '#a99e8f', steelDark: '#7a6f62', bush: '#689f38', bush2: '#4f7f29', accent: '#ff7043' },
    rule: { kind: 'count', start: 2, step: 2, order: 'asc', hint: '两个两个数：2、4、6、8…' },
    fact: '骆驼的驼峰里存的是脂肪，不是水。',
    repairs: ['绿洲的水井', '仙人掌喷水器', '遮阳棚', '沙漠指南针', '水壶工厂', '驼铃', '帐篷', '沙丘滑板', '星星望远镜'],
    intro: [
      [NARRATOR, '热乎乎的沙漠里，有一片小小的绿洲。'],
      [GRANDPA, '这里的机器人头顶数字不一样了，是 2、4、6、8……两个两个数！'],
      [BLUE, '2、4、6、8……我记住了！'],
    ],
    lines: [
      [ROBOT, '嘀……好热……我把水井盖子拧反了……'],
      [NARRATOR, '远处一只骆驼慢慢走过，驼铃叮当叮当。'],
      [GRANDPA, '两个两个数：2、4、6、8、10。'],
      [ROBOT, '我是挖水的机器人，可我一直在挖沙子……'],
      [BLUE, '沙地上留下了我的车轮印，好像一条长长的拉链。'],
      [NARRATOR, '太阳下山了，沙漠变成了橙红色。'],
      [GRANDPA, '晚上的沙漠很凉，打完这一关我们去绿洲边烤火。'],
      [ROBOT, '嘀嘀，我数到 12 就忘了下一个是几……'],
      [NARRATOR, '沙丘后面，有个大东西在慢慢移动……'],
    ],
    boss: { name: '沙丘机器人', face: '🏜️', hp: 5, color: '#c8873e' },
    bossIntro: [[GRANDPA, '沙丘机器人躲在沙子里好多天了。我们帮它醒过来！']],
    outro: [
      [ROBOT, '沙沙沙……我终于清醒了！绿洲的水又流起来啦！'],
      [GRANDPA, '乱码云往海边飞走了。听，海浪的声音！'],
    ],
  },
  {
    name: '海边灯塔', emoji: '🐙',
    theme: { floor: '#d7f0f5', floor2: '#c6e8ef', brick: '#e8a07a', brickLine: '#b5714e', steel: '#90a4ae', steelDark: '#62757f', bush: '#26a69a', bush2: '#1d867c', accent: '#29b6f6' },
    rule: { kind: 'count', start: 5, step: 5, order: 'asc', hint: '五个五个数：5、10、15、20…' },
    fact: '章鱼有三颗心脏，血是蓝色的。',
    repairs: ['灯塔的大灯', '码头的木板', '渔船的帆', '贝壳路标', '海鸥的窝', '救生圈架', '冰淇淋车', '沙滩伞', '潜水钟'],
    intro: [
      [NARRATOR, '海风咸咸的。高高的灯塔不亮了，渔船找不到回家的路。'],
      [GRANDPA, '这次的数字是 5、10、15、20……五个五个数，就像数手指！'],
    ],
    lines: [
      [ROBOT, '嘀……我是看灯塔的，可我把灯泡装反了……'],
      [NARRATOR, '一只小螃蟹横着走过，夹了夹小蓝的轮子。'],
      [GRANDPA, '一只手 5 根手指，两只手就是 10 根。'],
      [BLUE, '海浪一层一层地涌上来，好像在跟我打招呼。'],
      [ROBOT, '嘀嘀，我想捡贝壳，可我捡的全是石头。'],
      [NARRATOR, '海鸥在天上“嘎嘎”叫，好像在指路。'],
      [GRANDPA, '灯塔亮起来，渔船就能回家了。加油！'],
      [ROBOT, '我把冰淇淋做成了咸咸的海水味……'],
      [NARRATOR, '海面上冒出一对大钳子……'],
    ],
    boss: { name: '螃蟹机器人', face: '🦀', hp: 6, color: '#ef5350' },
    bossIntro: [[GRANDPA, '螃蟹机器人横着跑，还会一下子吐出好几个能量球！']],
    outro: [
      [ROBOT, '咔嚓咔嚓……我醒啦！灯塔重新亮了！'],
      [NARRATOR, '渔船一艘接一艘回到了港口。'],
      [GRANDPA, '乱码云往北边的雪山飘去了，多穿件衣服吧！'],
    ],
  },
  {
    name: '雪山', emoji: '❄️',
    theme: { floor: '#eef5fb', floor2: '#e2edf7', brick: '#9fc3e6', brickLine: '#6f97bf', steel: '#a0aec0', steelDark: '#6f7d90', bush: '#5b8f6a', bush2: '#467556', accent: '#4fc3f7' },
    rule: { kind: 'count', start: 10, step: 10, order: 'asc', hint: '十个十个数：10、20、30…' },
    fact: '雪花大多有六个角，而且几乎没有两片一模一样。',
    repairs: ['滑雪缆车', '温泉的水泵', '雪橇', '小木屋的壁炉', '企鹅的滑梯', '热可可机', '山顶的旗子', '雪地摩托', '冰雕灯'],
    intro: [
      [NARRATOR, '雪花轻轻飘。雪山上的机器人冻得迷迷糊糊。'],
      [GRANDPA, '这里的数字是 10、20、30……十个十个数！'],
      [BLUE, '10、20、30、40、50……数字变大啦！'],
    ],
    lines: [
      [ROBOT, '嘀……好冷……我把雪人堆到屋顶上了……'],
      [NARRATOR, '几只企鹅排着队，一摇一摆地看着小蓝。'],
      [GRANDPA, '冰块是蓝色的砖，也能打碎。'],
      [ROBOT, '嘀嘀，我的热可可变成冰棍了！'],
      [BLUE, '小心别打滑！'],
      [NARRATOR, '小木屋里飘出暖暖的炉火光。'],
      [GRANDPA, '十个十个数到一百，你就是数数小专家了。'],
      [ROBOT, '我是开缆车的，可缆车一直在倒着走……'],
      [NARRATOR, '山顶上有个大大的雪人在动……'],
    ],
    boss: { name: '雪人机器人', face: '⛄', hp: 6, color: '#90caf9' },
    bossIntro: [[GRANDPA, '雪人机器人会扔一大把雪球能量，别站着不动！']],
    outro: [
      [ROBOT, '咦，我的胡萝卜鼻子还在吗？谢谢你，小蓝！'],
      [GRANDPA, '山脚下是蘑菇森林，那里的数字要倒着数哦。'],
    ],
  },
  {
    name: '蘑菇森林', emoji: '🍄',
    theme: { floor: '#dfe9c8', floor2: '#d3e0b8', brick: '#b5835a', brickLine: '#86603f', steel: '#9e9e8e', steelDark: '#6f6f61', bush: '#388e3c', bush2: '#2b6e2e', accent: '#e57373' },
    rule: { kind: 'countdown', order: 'desc', hint: '倒着数：从最大的开始，5、4、3、2、1' },
    fact: '树干的年轮，一圈大约代表树长了一年。',
    repairs: ['松鼠的树洞', '蘑菇路灯', '小溪上的水车', '萤火虫灯笼', '护林员小屋', '鸟巢', '树屋的梯子', '森林邮局', '橡果仓库'],
    intro: [
      [NARRATOR, '森林里长满了五颜六色的蘑菇，可是今天安静得有点奇怪。'],
      [GRANDPA, '这次要倒着数！先找数字最大的机器人，就像火箭发射：5、4、3、2、1！'],
    ],
    lines: [
      [ROBOT, '嘀……我把松鼠的松果全藏起来了，现在自己也找不到……'],
      [NARRATOR, '萤火虫一闪一闪，给小蓝照亮了路。'],
      [GRANDPA, '倒着数：最大的先，最小的最后。'],
      [BLUE, '5、4、3、2、1，出发！'],
      [ROBOT, '嘀嘀，我在给蘑菇浇牛奶……'],
      [NARRATOR, '一只猫头鹰在树上“咕咕”叫。'],
      [GRANDPA, '数一数树的年轮，就知道它几岁了。'],
      [ROBOT, '我是送信的，可我把信都送给了大树……'],
      [NARRATOR, '森林深处，一朵巨大的蘑菇跳了起来……'],
    ],
    boss: { name: '蘑菇机器人', face: '🍄', hp: 7, color: '#e53935' },
    bossIntro: [[GRANDPA, '巨大的蘑菇机器人！它跳来跳去，会把砖块都撞碎。']],
    outro: [
      [ROBOT, '我……我是会跳舞的蘑菇机器人！谢谢你让我醒过来！'],
      [GRANDPA, '前面是热乎乎的火山温泉。乱码云就在那附近！'],
    ],
  },
  {
    name: '火山温泉', emoji: '🌋',
    theme: { floor: '#f5ddd0', floor2: '#efd0c0', brick: '#a1665a', brickLine: '#744438', steel: '#8d8a8a', steelDark: '#5f5c5c', bush: '#7b9e57', bush2: '#5f7f41', accent: '#ff7043' },
    rule: { kind: 'count', start: 11, step: 1, order: 'asc', hint: '从 11 开始数：11、12、13…' },
    fact: '火山喷出的熔岩冷却以后，会变成黑色的石头。',
    repairs: ['温泉池的栏杆', '煮鸡蛋的篮子', '蒸汽火车', '石头小路', '温度计', '火山观测站', '毛巾架', '泡脚池', '岩浆灯'],
    intro: [
      [NARRATOR, '远处的火山冒着白白的热气，温泉咕嘟咕嘟地冒泡。'],
      [GRANDPA, '这里的数字比 10 大：11、12、13……我们一起数下去！'],
    ],
    lines: [
      [ROBOT, '嘀……我把温泉蛋煮成了石头蛋……'],
      [NARRATOR, '一只小猴子泡在温泉里，舒服地眯着眼睛。'],
      [GRANDPA, '十一就是十和一，十二就是十和二。'],
      [BLUE, '这里暖暖的，砖块都是红红的石头。'],
      [ROBOT, '嘀嘀，蒸汽火车开到池子里去了！'],
      [NARRATOR, '地面微微发热，小蓝的轮子转得更快了。'],
      [GRANDPA, '看，乱码云就在天上！它好像……有点难过？'],
      [CLOUD, '哼！谁让你们都不跟我玩！'],
      [NARRATOR, '火山口冒出一个红彤彤的大家伙……'],
    ],
    boss: { name: '熔岩机器人', face: '🔥', hp: 7, color: '#ff5722' },
    bossIntro: [[GRANDPA, '熔岩机器人热得发红！它的能量球会三个一起飞。']],
    outro: [
      [ROBOT, '呼——凉快多了。谢谢你！'],
      [CLOUD, '哼……你们怎么都醒了……'],
      [GRANDPA, '乱码云躲进糖果工厂了。它说不定只是想要朋友。'],
    ],
  },
  {
    name: '糖果工厂', emoji: '🍭',
    theme: { floor: '#fde4ef', floor2: '#f9d6e6', brick: '#f48fb1', brickLine: '#c2577f', steel: '#b39ddb', steelDark: '#7e6aaf', bush: '#81c784', bush2: '#5fa864', accent: '#ec407a' },
    rule: { kind: 'count', start: 3, step: 3, order: 'asc', hint: '三个三个数：3、6、9、12…' },
    fact: '牙齿外面那层珐琅质，是我们身体里最硬的东西。吃完糖要刷牙哦！',
    repairs: ['棉花糖机', '巧克力河的桥', '糖果传送带', '饼干烤箱', '果冻弹簧床', '牙刷工厂', '彩虹糖包装机', '冰淇淋喷泉', '姜饼屋的门'],
    intro: [
      [NARRATOR, '空气里全是甜甜的味道。糖果工厂的传送带乱转，糖果到处飞。'],
      [GRANDPA, '这次三个三个数：3、6、9、12……'],
    ],
    lines: [
      [ROBOT, '嘀……我把盐放进了棉花糖里……'],
      [NARRATOR, '巧克力河缓缓流过，香得小蓝直吸鼻子。'],
      [GRANDPA, '3、6、9，就像跳格子，一次跳三格。'],
      [BLUE, '砖块是粉红色的糖块，打碎了会掉星星！'],
      [ROBOT, '嘀嘀，我在给饼干刷牙……'],
      [CLOUD, '这里的糖都是我的！……其实我也没尝过……'],
      [GRANDPA, '吃完糖记得刷牙，牙齿才会亮晶晶。'],
      [ROBOT, '我的果冻弹簧床把我弹到天花板上了！'],
      [NARRATOR, '工厂中间，一个软软的大棉花糖站了起来……'],
    ],
    boss: { name: '棉花糖机器人', face: '🍬', hp: 8, color: '#f06292' },
    bossIntro: [[GRANDPA, '棉花糖机器人软软的，可是很难停下来，多碰几次！']],
    outro: [
      [ROBOT, '好甜的一觉！给你一颗彩虹糖，谢谢你！'],
      [CLOUD, '……你们为什么要帮所有人？'],
      [BLUE, '因为大家都是朋友呀。'],
      [GRANDPA, '乱码云飞向星星城了。我们追上去！'],
    ],
  },
  {
    name: '星星城', emoji: '🌙',
    theme: { floor: '#dcdcf5', floor2: '#cfcff0', brick: '#7986cb', brickLine: '#4f5b9e', steel: '#9fa8b8', steelDark: '#6c7587', bush: '#4db6ac', bush2: '#36948b', accent: '#ffd54f' },
    rule: { kind: 'random', max: 50, order: 'asc', hint: '比大小：先找最小的数字' },
    fact: '月亮自己不会发光，我们看到的月光，是它反射的太阳光。',
    repairs: ['天文台的望远镜', '火箭发射台', '星星路灯', '卫星天线', '太空电梯', '月亮秋千', '流星收集网', '机器人宿舍', '星座地图'],
    intro: [
      [NARRATOR, '夜晚的星星城闪闪发光，机器人们住在这里看星星。'],
      [GRANDPA, '这里的数字是乱的！要比大小，先找最小的那个。'],
    ],
    lines: [
      [ROBOT, '嘀……我把北斗七星连成了一只鸭子……'],
      [NARRATOR, '一颗流星划过夜空，小蓝悄悄许了个愿。'],
      [GRANDPA, '比一比：十位大的数字就大；十位一样，再看个位。'],
      [BLUE, '月亮亮亮的，可它是借太阳的光呢。'],
      [ROBOT, '嘀嘀，我的火箭倒着飞进了地下室。'],
      [CLOUD, '我从来没有朋友陪我看星星……'],
      [GRANDPA, '小蓝，等打败迷糊大家伙，我们去和乱码云谈谈。'],
      [ROBOT, '我是数星星的，可我数到 3 就睡着了……'],
      [NARRATOR, '天上一颗卫星“嗡嗡”地落了下来……'],
    ],
    boss: { name: '卫星机器人', face: '🛰️', hp: 8, color: '#5c6bc0' },
    bossIntro: [[GRANDPA, '卫星机器人从太空掉下来，晕头转向的，快帮帮它！']],
    outro: [
      [ROBOT, '我看见了！乱码云的家在云朵城堡，好高好高。'],
      [GRANDPA, '最后一站了，小蓝。我们去云朵城堡！'],
    ],
  },
  {
    name: '云朵城堡', emoji: '🌈',
    theme: { floor: '#e8f1ff', floor2: '#dce8fc', brick: '#b0bec5', brickLine: '#7f8f97', steel: '#9fa8da', steelDark: '#6f78ab', bush: '#a5d6a7', bush2: '#7fbf82', accent: '#ab47bc' },
    rule: { kind: 'random', max: 100, order: 'asc', hint: '比大小：先找最小的数字（最大到 100）' },
    fact: '彩虹是阳光穿过空中的小水滴变出来的，所以雨后常能看到。',
    repairs: ['城堡的吊桥', '云朵弹簧床', '彩虹滑梯', '风铃塔', '雨滴水池', '云朵花园', '城堡的大钟', '天空灯笼', '云朵邮局'],
    intro: [
      [NARRATOR, '小蓝爬上了高高的云朵城堡，软绵绵的云在脚下。'],
      [CLOUD, '你别过来！我……我只会放乱码闪电，没人喜欢我。'],
      [GRANDPA, '乱码云，你只是孤单，对吗？让小蓝帮城堡里的机器人醒过来，我们再一起聊聊。'],
    ],
    lines: [
      [ROBOT, '嘀……我把城堡的大钟拨到了下个星期……'],
      [NARRATOR, '云朵弹簧床把小蓝弹得高高的，好好玩！'],
      [GRANDPA, '先找最小的数字，再找下一个，一直到最大的。'],
      [CLOUD, '为什么你们打我的机器人，它们还说谢谢？'],
      [BLUE, '因为“晚安能量球”是帮它们好好睡一觉呀。'],
      [ROBOT, '嘀嘀，我在给云朵浇水，结果下雨了……'],
      [CLOUD, '原来……大家睡醒了都在笑。'],
      [GRANDPA, '快到城堡的中心了，最后一点点！'],
      [NARRATOR, '城堡中心，乱码云的机器心脏在噼啪作响……'],
    ],
    boss: { name: '乱码云核心', face: '🌩️', hp: 10, color: '#8e24aa' },
    bossIntro: [
      [CLOUD, '我的闪电机器停不下来了！帮帮我！'],
      [GRANDPA, '小蓝，让乱码云的核心也好好睡一觉吧！'],
    ],
    outro: [
      [NARRATOR, '核心“噗”地一声安静下来。乱码云变得白白的，软软的。'],
      [CLOUD, '对不起，我只是太想有人陪我玩了。'],
      [BLUE, '那以后我们一起玩吧！'],
      [NARRATOR, '乱码云高兴地洒下一场小雨，天上出现了一道大大的彩虹。'],
      [GRANDPA, '小蓝，你帮所有人都找到了好梦。你是最棒的小坦克！'],
    ],
  },
];

const LEVELS_PER_WORLD = 10;
const LEVEL_COUNT = WORLDS.length * LEVELS_PER_WORLD;

function worldOf(level) { return WORLDS[Math.floor((level - 1) / LEVELS_PER_WORLD)]; }
function stageOf(level) { return ((level - 1) % LEVELS_PER_WORLD) + 1; }
function isBossLevel(level) { return stageOf(level) === LEVELS_PER_WORLD; }

// Story card shown before a level starts.
function storyBefore(level) {
  const w = worldOf(level), s = stageOf(level);
  const lines = [];
  if (s === 1) lines.push(...w.intro);
  if (s === LEVELS_PER_WORLD) lines.push(...w.bossIntro);
  else if (s > 1) lines.push(w.lines[(s - 2) % w.lines.length]);
  else lines.push(w.lines[0]);
  return lines;
}

// Story card shown after a level is won.
function storyAfter(level, rescued) {
  const w = worldOf(level), s = stageOf(level);
  if (s === LEVELS_PER_WORLD) {
    return [...w.outro, [NARRATOR, '🧠 小知识：' + w.fact]];
  }
  const repair = w.repairs[(s - 1) % w.repairs.length];
  return [[ROBOT, `${rescued} 个机器人醒过来啦！它们一起修好了${repair}。`]];
}

function chineseNumber(n) {
  const d = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n < 10) return d[n];
  if (n === 100) return '一百';
  const t = Math.floor(n / 10), o = n % 10;
  return (t === 1 ? '' : d[t]) + '十' + (o ? d[o] : '');
}

const STORY = { WORLDS, LEVELS_PER_WORLD, LEVEL_COUNT, worldOf, stageOf, isBossLevel, storyBefore, storyAfter, chineseNumber, NARRATOR, GRANDPA, BLUE, ROBOT, CLOUD };
if (typeof module !== 'undefined') module.exports = STORY; else window.STORY = STORY;
