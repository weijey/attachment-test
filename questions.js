// ECR-R 成人依恋量表（36 题）
// 来源：Fraley, Waller & Brennan (2000), JPSP 78(2), 350-365
// 题目原文取自 Fraley 官方页面 labs.psychology.illinois.edu/~rcfraley/measures/ecrr.htm
// 中文译文：针对「朋友 / 喜欢的人」改写，原量表的 partner 语义统一为「亲近的人 / 那个人 / 对方」。
// dim: 'anxiety' | 'avoidance'；reversed: true 表示反向计分题（得分 = 8 - 原始分）

const QUESTIONS = [
  // ===== 焦虑维度（anxiety，18 题）=====
  {
    id: 168,
    dim: "anxiety",
    reversed: false,
    en: "I'm afraid that I will lose my partner's love.",
    zh: "我害怕会失去那个人对我的在乎。",
  },
  {
    id: 57,
    dim: "anxiety",
    reversed: false,
    en: "I often worry that my partner will not want to stay with me.",
    zh: "我常常担心那个人不想再和我保持现在这样的关系。",
  },
  {
    id: 1,
    dim: "anxiety",
    reversed: false,
    en: "I often worry that my partner doesn't really love me.",
    zh: "我常常担心那个人其实并没有真的在乎我。",
  },
  {
    id: 83,
    dim: "anxiety",
    reversed: false,
    en: "I worry that romantic partners won't care about me as much as I care about them.",
    zh: "我担心自己在意的程度，比对方在意的程度更深。",
  },
  {
    id: 110,
    dim: "anxiety",
    reversed: false,
    en: "I often wish that my partner's feelings for me were as strong as my feelings for him or her.",
    zh: "我常希望对方对我的重视，能和我对 ta 的一样多。",
  },
  {
    id: 245,
    dim: "anxiety",
    reversed: false,
    en: "I worry a lot about my relationships.",
    zh: "我常常为和别人之间的关系感到不安。",
  },
  {
    id: 226,
    dim: "anxiety",
    reversed: false,
    en: "When my partner is out of sight, I worry that he or she might become interested in someone else.",
    zh: "当那个人不在我身边时，我会担心 ta 对别人更感兴趣。",
  },
  {
    id: 142,
    dim: "anxiety",
    reversed: false,
    en: "When I show my feelings for romantic partners, I'm afraid they will not feel the same about me.",
    zh: "当我表达对那个人的在意时，我害怕对方不会同样回应我。",
  },
  {
    id: 191,
    dim: "anxiety",
    reversed: true,
    en: "I rarely worry about my partner leaving me.",
    zh: "我很少担心那个人会离开我。",
  },
  {
    id: 208,
    dim: "anxiety",
    reversed: false,
    en: "My romantic partner makes me doubt myself.",
    zh: "和那个人相处时，我会开始怀疑自己。",
  },
  {
    id: 82,
    dim: "anxiety",
    reversed: true,
    en: "I do not often worry about being abandoned.",
    zh: "我不太担心自己会被抛下。",
  },
  {
    id: 74,
    dim: "anxiety",
    reversed: false,
    en: "I find that my partner(s) don't want to get as close as I would like.",
    zh: "我发现对方并不像我希望的那样愿意靠近我。",
  },
  {
    id: 112,
    dim: "anxiety",
    reversed: false,
    en: "Sometimes romantic partners change their feelings about me for no apparent reason.",
    zh: "有时对方对我的态度会突然变化，我想不出原因。",
  },
  {
    id: 89,
    dim: "anxiety",
    reversed: false,
    en: "My desire to be very close sometimes scares people away.",
    zh: "我太想靠近一个人的时候，反而会把对方吓跑。",
  },
  {
    id: 78,
    dim: "anxiety",
    reversed: false,
    en: "I'm afraid that once a romantic partner gets to know me, he or she won't like who I really am.",
    zh: "我害怕对方真正了解我之后，会不喜欢真实的我。",
  },
  {
    id: 99,
    dim: "anxiety",
    reversed: false,
    en: "It makes me mad that I don't get the affection and support I need from my partner.",
    zh: "我从对方那里得不到想要的关心和支持，这让我很恼火。",
  },
  {
    id: 280,
    dim: "anxiety",
    reversed: false,
    en: "I worry that I won't measure up to other people.",
    zh: "我担心自己比不上别人。",
  },
  {
    id: 87,
    dim: "anxiety",
    reversed: false,
    en: "My partner only seems to notice me when I'm angry.",
    zh: "好像只有在我生气的时候，对方才会注意到我。",
  },

  // ===== 回避维度（avoidance，18 题）=====
  {
    id: 199,
    dim: "avoidance",
    reversed: false,
    en: "I prefer not to show a partner how I feel deep down.",
    zh: "我不愿意让亲近的人看到我内心深处的感受。",
  },
  {
    id: 131,
    dim: "avoidance",
    reversed: true,
    en: "I feel comfortable sharing my private thoughts and feelings with my partner.",
    zh: "我可以自在地向亲近的人讲我私下的想法和感受。",
  },
  {
    id: 59,
    dim: "avoidance",
    reversed: false,
    en: "I find it difficult to allow myself to depend on romantic partners.",
    zh: "我很难让自己去依赖亲近的人。",
  },
  {
    id: 265,
    dim: "avoidance",
    reversed: true,
    en: "I am very comfortable being close to romantic partners.",
    zh: "和亲近的人相处让我觉得很自在。",
  },
  {
    id: 171,
    dim: "avoidance",
    reversed: false,
    en: "I don't feel comfortable opening up to romantic partners.",
    zh: "向亲近的人敞开心扉让我不舒服。",
  },
  {
    id: 267,
    dim: "avoidance",
    reversed: false,
    en: "I prefer not to be too close to romantic partners.",
    zh: "我不太愿意和亲近的人走得太近。",
  },
  {
    id: 201,
    dim: "avoidance",
    reversed: false,
    en: "I get uncomfortable when a romantic partner wants to be very close.",
    zh: "当有人想和我变得非常亲近时，我会不自在。",
  },
  {
    id: 36,
    dim: "avoidance",
    reversed: true,
    en: "I find it relatively easy to get close to my partner.",
    zh: "对我来说，和别人变得亲近不算难。",
  },
  {
    id: 279,
    dim: "avoidance",
    reversed: true,
    en: "It's not difficult for me to get close to my partner.",
    zh: "和别人走得近，对我来说不难。",
  },
  {
    id: 119,
    dim: "avoidance",
    reversed: true,
    en: "I usually discuss my problems and concerns with my partner.",
    zh: "我通常会把自己的困扰和担心讲给亲近的人听。",
  },
  {
    id: 238,
    dim: "avoidance",
    reversed: true,
    en: "It helps to turn to my romantic partner in times of need.",
    zh: "需要的时候，向亲近的人求助是有用的。",
  },
  {
    id: 14,
    dim: "avoidance",
    reversed: true,
    en: "I tell my partner just about everything.",
    zh: "我几乎什么都会告诉我亲近的人。",
  },
  {
    id: 294,
    dim: "avoidance",
    reversed: true,
    en: "I talk things over with my partner.",
    zh: "我会把遇到的事和亲近的人一起聊。",
  },
  {
    id: 105,
    dim: "avoidance",
    reversed: false,
    en: "I am nervous when partners get too close to me.",
    zh: "有人想和我走得太近时，我会紧张。",
  },
  {
    id: 242,
    dim: "avoidance",
    reversed: true,
    en: "I feel comfortable depending on romantic partners.",
    zh: "依赖亲近的人让我觉得自在。",
  },
  {
    id: 220,
    dim: "avoidance",
    reversed: true,
    en: "I find it easy to depend on romantic partners.",
    zh: "对我来说，依赖亲近的人是件容易的事。",
  },
  {
    id: 300,
    dim: "avoidance",
    reversed: true,
    en: "It's easy for me to be affectionate with my partner.",
    zh: "对亲近的人表达感情，对我来说很容易。",
  },
  {
    id: 228,
    dim: "avoidance",
    reversed: true,
    en: "My partner really understands me and my needs.",
    zh: "我亲近的人是真正理解我和我的需要的。",
  },
];

// 反向题计数校验：焦虑 2 条 + 回避 12 条 = 14 条
const REVERSED_COUNT = QUESTIONS.filter((q) => q.reversed).length;
if (REVERSED_COUNT !== 14) {
  throw new Error(`反向题数量异常：期望 14，实际 ${REVERSED_COUNT}`);
}
