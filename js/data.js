/* 默认示例数据：首次打开时用于演示，也可随时恢复。 */
(function () {
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toDateStr(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return toDateStr(d);
  }

  window.TXK_SEED = function createSeedData() {
    const today = new Date();
    const todayStr = toDateStr(today);
    const day = (offset) => addDays(today, offset);

    const subjects = [
      { id: "chinese", name: "语文", color: "#eab308" },
      { id: "math", name: "数学", color: "#4f6ef7" },
      { id: "english", name: "英语", color: "#0ea5e9" },
      { id: "physics", name: "物理", color: "#8b5cf6" },
      { id: "chemistry", name: "化学", color: "#f97316" },
      { id: "biology", name: "生物", color: "#16a34a" },
      { id: "politics", name: "政治", color: "#dc2626" },
      { id: "history", name: "历史", color: "#b45309" },
      { id: "geography", name: "地理", color: "#14b8a6" },
    ];

    const knowledgePoints = [
      {
        id: "ch-yanwenzici",
        subjectId: "chinese",
        name: "文言文实词与虚词",
        summary:
          "高频实词要结合语境推断，重点关注一词多义、古今异义、通假字；常考虚词如“而、以、其、之、于、乃”要掌握词性、意义和用法。",
        extension:
          "翻译题通常采用“直译为主、意译为辅”，先逐字对应，再按现代汉语语序调整。虚词常和固定结构结合，如“何以”“所以”“其……乎”。",
        tips: "先看语境再定词义；把实词代入四个选项分别验证；翻译时补出省略的主语和介词宾语。",
        commonMistakes: "只记课内义项，忽略语境活用；翻译时漏译虚词或把古今义混为一谈。",
      },
      {
        id: "ch-poetry",
        subjectId: "chinese",
        name: "古诗词鉴赏手法",
        summary:
          "从内容、情感、手法、语言四个角度切入。常见手法包括借景抒情、托物言志、虚实结合、动静结合、对比、用典、炼字等。",
        extension:
          "“炼字”题要解释字义、还原画面、点明手法、写出情感；写景诗可分析意象组合和意境特征，咏史诗要联系背景与古今对比。",
        tips: "答题按“手法 + 内容 + 效果 + 情感”四步展开，避免只贴标签不结合诗句。",
        commonMistakes: "术语堆砌而不分析；混淆借代与借喻、衬托与对比；脱离题目直接套用模板。",
      },
      {
        id: "ch-argument",
        subjectId: "chinese",
        name: "议论文结构与论证",
        summary:
          "议论文要有明确的中心论点，采用并列式、递进式或对照式结构；论证方法主要有举例、道理、对比、比喻、引用论证。",
        extension:
          "高考作文常用“引—议—联—结”：引材料提观点，分析原因和影响，联系现实或个人体验，最后升华收束。",
        tips: "中心论点放在开头和结尾反复点题；每段开头用分论点句，段内做到观点、材料、分析三者结合。",
        commonMistakes: "材料和观点脱节；叙述事例过长导致文体不明；只写现象不做因果和意义分析。",
      },
      {
        id: "ch-reading",
        subjectId: "chinese",
        name: "现代文阅读答题规范",
        summary:
          "信息类文本要圈画关键词、关注指代和逻辑关系；文学类文本要把握人物、情节、环境、主题和叙事视角。",
        extension:
          "作用题从内容、结构、表达效果三方面答；含义题先表层再深层；探究题要基于文本，又要适当联系现实。",
        tips: "答案分点，先概括后分析；问“作用”必答结构作用；结合原文语句，不凭空发挥。",
        commonMistakes: "答案过于笼统；只答术语不结合文本；审题不清，把含义题答成作用题。",
      },

      {
        id: "ma-function",
        subjectId: "math",
        name: "函数的单调性与最值",
        summary:
          "判断单调性可用定义法、导数法和图像法。导数大于 0 时函数单调递增，小于 0 时单调递减。",
        extension:
          "含参函数求最值常需对参数分类讨论；构造新函数解决恒成立问题，转化为最值比较。",
        tips: "先求定义域再求导；极值点不一定是最值点，还要比较区间端点。",
        commonMistakes: "忽略定义域；把导数为零的点直接当成极值点；分类讨论时遗漏边界情况。",
      },
      {
        id: "ma-trig",
        subjectId: "math",
        name: "三角函数图像与性质",
        summary:
          "掌握 y=Asin(ωx+φ) 的振幅、周期、相位与图像变换；正弦、余弦、正切函数的定义域、值域、奇偶性和对称性。",
        extension:
          "图像平移遵循“左加右减”，伸缩变换改变周期；已知部分图像求解析式时先定 A，再定周期和 φ。",
        tips: "将 ωx+φ 看成一个整体；注意平移单位是对 x 而不是对 ωx 的平移。",
        commonMistakes: "平移方向判断错误；忘记先提取系数；周期公式误写为 2π/ω 或 2πω。",
      },
      {
        id: "ma-sequence",
        subjectId: "math",
        name: "等差数列与等比数列",
        summary:
          "等差通项 an=a1+(n-1)d，求和 Sn=n(a1+an)/2；等比通项 an=a1q^(n-1)，求和分 q=1 和 q≠1 两种情况。",
        extension:
          "由递推关系求通项常用累加、累乘、构造等差或等比数列；错位相减、裂项相消是数列求和高频方法。",
        tips: "等比数列求和先判断 q=1；遇到 Sn 与 an 关系式时用 an=Sn-S(n-1)，并验证 n=1。",
        commonMistakes: "忘记验证首项；等比求和漏掉 q=1；错位相减时项数对不齐。",
      },
      {
        id: "ma-probability",
        subjectId: "math",
        name: "概率与统计",
        summary:
          "古典概型用 P(A)=m/n；掌握互斥事件、对立事件、独立事件的概率运算；理解离散型随机变量的分布列和期望。",
        extension:
          "二项分布、超几何分布要注意适用条件；统计中要区分平均数、中位数、众数、方差和标准差。",
        tips: "先判断事件关系再选公式；分布列概率之和为 1 可用于检验。",
        commonMistakes: "把有序和无序计数混淆；忽视“不放回”和“放回”区别；把频率当成概率。",
      },

      {
        id: "en-attributive",
        subjectId: "english",
        name: "定语从句",
        summary:
          "关系代词 that、which、who、whom、whose 和关系副词 when、where、why 的选用取决于先行词及从句成分。",
        extension:
          "非限制性定语从句用逗号隔开，不能用 that；介词+关系代词时先行词为人用 whom，为物用 which。",
        tips: "先找出先行词，再判断从句缺什么成分；缺主语或宾语用关系代词，缺状语用关系副词。",
        commonMistakes: "非限制性定语从句误用 that；先行词与关系词单复数不一致；介词提前后漏掉 which/whom。",
      },
      {
        id: "en-subjunctive",
        subjectId: "english",
        name: "虚拟语气",
        summary:
          "表示与现在、过去、将来事实相反的假设时，条件句和主句的时态要按规则后退；wish、as if、if only 也有虚拟用法。",
        extension:
          "suggest、demand、insist 等表示建议、要求、坚持时，宾语从句用 (should)+动词原形；would rather 后接过去时或过去完成时。",
        tips: "看时间状语判断假设时间；主从句时态分别记忆，避免只记从句。",
        commonMistakes: "主句和从句时态混用；把 insist 表示“坚持认为”时误用虚拟；should 省略后忘了用原形。",
      },
      {
        id: "en-reading",
        subjectId: "english",
        name: "阅读理解细节与推断",
        summary:
          "先题后文，圈定题干关键词；细节题要回原文定位，推断题要基于原文而非常识。",
        extension:
          "主旨题关注首段、尾段和每段主题句；词义猜测题利用同义、反义、举例、构词法和上下文逻辑。",
        tips: "选项与原文进行同义替换比对；绝对化选项如 always、never 要特别警惕。",
        commonMistakes: "凭印象做题不回原文；偷换概念；把作者观点和文中人物观点混淆。",
      },
      {
        id: "en-writing",
        subjectId: "english",
        name: "书面表达与应用文",
        summary:
          "应用文注意格式、称呼、正文、结尾和落款；正文要覆盖要点，逻辑连贯，语言得体。",
        extension:
          "使用过渡词提升连贯性；适当使用高级句式和词汇，但准确性优先。",
        tips: "写前列提纲；每个要点扩展 1-2 句；留 3-5 分钟检查拼写、时态和主谓一致。",
        commonMistakes: "遗漏要点；中文式表达；时态混乱和拼写错误多。",
      },

      {
        id: "ph-newton",
        subjectId: "physics",
        name: "牛顿运动定律",
        summary:
          "牛顿第二定律 F=ma，加速度与合外力同向；受力分析按重力、弹力、摩擦力、其他力顺序进行。",
        extension:
          "整体法和隔离法解决连接体问题；临界问题常涉及弹力为零、摩擦力达到最大值或刚要分离。",
        tips: "先画受力图，再建坐标系；沿加速度方向建立方程。",
        commonMistakes: "漏力或多画力；把平衡状态误当加速状态；连接体加速度方向判断错误。",
      },
      {
        id: "ph-energy",
        subjectId: "physics",
        name: "功能关系与机械能",
        summary:
          "功 W=Flcosα；动能定理 W合=ΔEk；机械能守恒条件为只有重力或弹力做功。",
        extension:
          "多过程问题可分段或全程使用动能定理；传送带、弹簧模型要分析能量转化和摩擦生热。",
        tips: "选定初末状态，明确各力做功情况；优先考虑动能定理和能量守恒。",
        commonMistakes: "忽略摩擦力做功；机械能守恒条件判断错误；重力势能零势面选取混乱。",
      },
      {
        id: "ph-electric",
        subjectId: "physics",
        name: "电场与电路",
        summary:
          "电场强度 E=F/q，电势差 U=W/q；欧姆定律 I=U/R，闭合电路 E=U外+Ir。",
        extension:
          "带电粒子在电场中的偏转与类平抛运动结合；动态电路分析用“串反并同”或程序法。",
        tips: "画等效电路图，分清串并联；注意电流、电压、电阻的因果关系。",
        commonMistakes: "把电场线方向与电势高低、电荷运动方向混为一谈；动态电路中电阻变化方向判断错误。",
      },
      {
        id: "ph-magnetic",
        subjectId: "physics",
        name: "磁场与电磁感应",
        summary:
          "安培力 F=BILsinθ，洛伦兹力 f=qvB；法拉第电磁感应定律 E=nΔΦ/Δt，楞次定律判断感应电流方向。",
        extension:
          "带电粒子在匀强磁场中做匀速圆周运动，半径 r=mv/qB；电磁感应常与电路、能量结合。",
        tips: "先用楞次定律或右手定则判方向，再求大小；画轨迹找圆心和半径。",
        commonMistakes: "左右手定则混用；忽略有效切割长度或有效面积；能量关系漏掉焦耳热。",
      },

      {
        id: "ch-equilibrium",
        subjectId: "chemistry",
        name: "化学平衡与速率",
        summary:
          "可逆反应达到平衡时正逆反应速率相等，各组分浓度不变；勒夏特列原理判断平衡移动方向。",
        extension:
          "平衡常数 K 只随温度变化；浓度、压强、温度、催化剂对速率和平衡的影响要分开判断。",
        tips: "先判断条件改变是影响速率还是平衡；比较 K 与 Q 判断反应方向。",
        commonMistakes: "把催化剂的影响写错为影响平衡；压强改变对无气体反应无影响；忽略温度对 K 的影响。",
      },
      {
        id: "ch-redox",
        subjectId: "chemistry",
        name: "氧化还原反应",
        summary:
          "氧化剂得电子被还原，还原剂失电子被氧化；守恒规律是配平和计算的核心。",
        extension:
          "离子方程式书写要拆强酸、强碱、可溶盐；陌生氧化还原反应可用电子守恒、电荷守恒、质量守恒配平。",
        tips: "标化合价，找变价元素；先电子守恒，再电荷守恒，最后质量守恒。",
        commonMistakes: "升降价总数不等；介质中 H+、OH-、H2O 补错；忘记判断反应物是否过量。",
      },
      {
        id: "ch-organic",
        subjectId: "chemistry",
        name: "有机化学基础",
        summary:
          "掌握官能团性质，如羟基、醛基、羧基、酯基、双键、苯环等；同分异构体按碳链、位置、官能团异构分类。",
        extension:
          "有机物推断要从分子式、官能团、反应条件切入；酯化、加成、取代、消去、氧化等反应要能书写。",
        tips: "不饱和度帮助判断结构；同分异构体按顺序列举避免重复。",
        commonMistakes: "漏写官能团异构；有机反应漏写小分子；结构简式书写不规范。",
      },
      {
        id: "ch-solution",
        subjectId: "chemistry",
        name: "溶液中的离子平衡",
        summary:
          "弱电解质的电离、水的离子积、盐类水解、沉淀溶解平衡是核心；pH 计算和离子浓度比较常见。",
        extension:
          "三大守恒：电荷守恒、物料守恒、质子守恒；酸碱中和滴定曲线可分析各点离子浓度。",
        tips: "先写电荷守恒，再结合物料守恒推质子守恒；比较离子浓度时考虑水解和电离程度。",
        commonMistakes: "忽略水的电离；多元弱酸分步电离；质子守恒系数配错。",
      },

      {
        id: "bi-genetics",
        subjectId: "biology",
        name: "遗传的基本规律",
        summary:
          "分离定律和自由组合定律是遗传题基础；基因型、表现型比例通过配子法或棋盘法推导。",
        extension:
          "伴性遗传注意基因位于 X 或 Y 染色体；两对及以上等位基因自由组合时用拆分法逐对分析。",
        tips: "先判断显隐性，再定基因位置，最后写基因型；遗传系谱图先找突破口。",
        commonMistakes: "显隐性判断错误；忽略致死、不完全显性等特殊比例；概率计算漏乘。",
      },
      {
        id: "bi-cell",
        subjectId: "biology",
        name: "细胞结构与代谢",
        summary:
          "细胞膜具有选择透过性；线粒体、叶绿体、内质网、高尔基体等细胞器的结构和功能要对应。",
        extension:
          "光合作用和呼吸作用结合考查物质和能量变化；影响酶活性和光合速率的因素要会分析曲线。",
        tips: "画物质变化图辅助理解；注意“结构决定功能”的答题逻辑。",
        commonMistakes: "细胞器名称写错；光合和呼吸场所混淆；影响因素的曲线拐点解释不清。",
      },
      {
        id: "bi-regulation",
        subjectId: "biology",
        name: "生命活动的调节",
        summary:
          "神经调节通过反射弧完成，体液调节依赖激素，免疫调节包括非特异性免疫和特异性免疫。",
        extension:
          "血糖调节、体温调节、水盐平衡调节是综合题重点；特异性免疫涉及细胞免疫和体液免疫的配合。",
        tips: "按刺激、感受器、传入神经、中枢、传出神经、效应器梳理反射弧。",
        commonMistakes: "反射弧结构顺序颠倒；激素作用对象不清；免疫细胞功能混淆。",
      },
      {
        id: "bi-ecology",
        subjectId: "biology",
        name: "生态系统与环境保护",
        summary:
          "生态系统的成分包括非生物物质和能量、生产者、消费者、分解者；能量流动逐级递减，物质循环反复利用。",
        extension:
          "食物链和食物网分析、能量传递效率计算、生物多样性价值是常见考点。",
        tips: "能量传递效率按 10%-20% 估算；写食物链起点是生产者。",
        commonMistakes: "把分解者放入食物链；能量传递效率计算错误；生物多样性层次混淆。",
      },

      {
        id: "po-philosophy",
        subjectId: "politics",
        name: "唯物辩证法",
        summary:
          "联系、发展、矛盾是辩证法核心观点。矛盾具有普遍性和特殊性，要具体问题具体分析。",
        extension:
          "用联系观、发展观、矛盾分析法解释社会现象；量变与质变、前进性与曲折性常结合材料考查。",
        tips: "先找材料中的关键词，再对应原理；答题写原理、方法论，并结合材料。",
        commonMistakes: "原理与材料两张皮；把矛盾普遍性和特殊性写反；忘记写方法论。",
      },
      {
        id: "po-economy",
        subjectId: "politics",
        name: "我国基本经济制度",
        summary:
          "公有制为主体、多种所有制经济共同发展；按劳分配为主体、多种分配方式并存；社会主义市场经济体制。",
        extension:
          "结合企业、政府、市场、就业等热点，分析经济制度对高质量发展和共同富裕的作用。",
        tips: "答题从“制度内容 + 意义 + 材料”展开；注意区分经济制度三个层次。",
        commonMistakes: "混淆公有制和国有经济；分配方式判断错误；意义空泛不结合材料。",
      },
      {
        id: "po-law",
        subjectId: "politics",
        name: "全面依法治国",
        summary:
          "依法治国是党领导人民治理国家的基本方略，坚持党的领导、人民当家作主、依法治国有机统一。",
        extension:
          "从科学立法、严格执法、公正司法、全民守法四个环节分析法治建设。",
        tips: "注意主体：党领导、人大立法、政府执法、司法机关司法、公民守法。",
        commonMistakes: "主体行为对应错误；把党的领导和依法治国割裂；套用模板不扣材料。",
      },
      {
        id: "po-culture",
        subjectId: "politics",
        name: "文化传承与创新",
        summary:
          "继承优秀传统文化，推动创造性转化和创新性发展；坚定文化自信，讲好中国故事。",
        extension:
          "结合文化遗产、科技赋能、文明交流互鉴等案例，分析文化继承、发展、创新的关系。",
        tips: "先定性文化现象，再回答做法和意义；使用“取其精华、去其糟粕”等规范表达。",
        commonMistakes: "继承与创新关系颠倒；只谈文化不结合时代；意义回答不完整。",
      },

      {
        id: "hi-ancient",
        subjectId: "history",
        name: "中国古代政治制度",
        summary:
          "从分封制、宗法制到专制主义中央集权制度，掌握制度演变、背景和影响。",
        extension:
          "科举制、三省六部制、行省制等要从选官、行政、监察、地方管理角度梳理。",
        tips: "按朝代时间轴记忆；回答原因和影响时联系经济基础和时代背景。",
        commonMistakes: "朝代和制度对应错误；把专制主义与中央集权混为一谈；只答内容不评影响。",
      },
      {
        id: "hi-modern",
        subjectId: "history",
        name: "中国近代化探索",
        summary:
          "从洋务运动、戊戌变法、辛亥革命到新文化运动，探索由器物到制度再到思想文化逐步深入。",
        extension:
          "结合经济、政治、思想三方面分析近代化进程；比较各运动的背景、内容、结果和局限。",
        tips: "材料题先判断时期和阶级立场；评价历史事件要坚持唯物史观。",
        commonMistakes: "运动性质判断错误；忽视阶级局限性；把近代化等同于完全西化。",
      },
      {
        id: "hi-world",
        subjectId: "history",
        name: "世界近现代史",
        summary:
          "新航路开辟、工业革命、资产阶级革命、两次世界大战和战后格局是核心线索。",
        extension:
          "分析生产力发展对世界市场形成和国际关系演变的影响；比较不同国家现代化道路。",
        tips: "按时间轴和因果链记忆；大题分背景、过程、结果、影响四层作答。",
        commonMistakes: "时间顺序混乱；把事件原因和影响倒置；忽视经济根源。",
      },
      {
        id: "hi-reform",
        subjectId: "history",
        name: "中外重大改革",
        summary:
          "商鞅变法、北魏孝文帝改革、王安石变法、明治维新、罗斯福新政等要从背景、措施、影响比较。",
        extension:
          "改革成败与当时社会矛盾、力量对比和改革者策略密切相关；评价要辩证、历史地看待。",
        tips: "列比较表区分改革领域和性质；措施与影响一一对应。",
        commonMistakes: "把改革性质张冠李戴；只列措施不分析作用；评价片面。",
      },

      {
        id: "ge-climate",
        subjectId: "geography",
        name: "气候类型与成因",
        summary:
          "从纬度、大气环流、海陆位置、地形、洋流等方面分析气温和降水，判断气候类型。",
        extension:
          "气候对农业、河流、植被和聚落的影响是综合题重点；比较不同气候类型的特征与分布。",
        tips: "先看气温定温度带，再看降水定类型；用“以温定带、以水定型”方法。",
        commonMistakes: "南北半球判断错误；季风气候和海陆位置混淆；忽略地形雨和洋流影响。",
      },
      {
        id: "ge-landform",
        subjectId: "geography",
        name: "地质作用与地貌",
        summary:
          "内力作用塑造地表基本格局，外力作用削高填低；背斜、向斜、断层和河流地貌是高频考点。",
        extension:
          "分析地貌形成过程按“内力 + 外力 + 时间”展开；河流侵蚀和堆积地貌要结合上下游差异。",
        tips: "看到地质剖面先判断岩层新老和构造类型；描述过程用“先……后……”。",
        commonMistakes: "背斜成山、向斜成谷当成必然；地质过程顺序颠倒；外力作用类型混淆。",
      },
      {
        id: "ge-industry",
        subjectId: "geography",
        name: "农业与工业区位",
        summary:
          "农业区位考虑自然和社会经济因素；工业区位受原料、市场、劳动力、交通、科技、政策等影响。",
        extension:
          "区位条件评价要有利弊两面；产业转移、工业集聚与分散、可持续发展是综合题方向。",
        tips: "答题先自然后社会经济；用“因素 + 材料 + 影响”结构作答。",
        commonMistakes: "因素遗漏；只答有利不答不利；把主导因素和一般因素混为一谈。",
      },
      {
        id: "ge-population",
        subjectId: "geography",
        name: "人口与城市",
        summary:
          "人口增长模式、人口迁移原因、城市功能分区和城市化是核心内容。",
        extension:
          "城市化问题及解决措施、城市群和区域协调发展可结合具体城市案例。",
        tips: "看图先读坐标和单位；人口迁移从推力、拉力两方面分析。",
        commonMistakes: "人口增长模式判断错误；城市化水平与速度混淆；功能区布局理由不完整。",
      },
    ];

    const questions = [
      {
        id: "q1",
        subjectId: "math",
        kpIds: ["ma-function"],
        question: "已知函数 f(x)=x³-3x+1，求 f(x) 在区间 [-2,2] 上的最大值和最小值。",
        answer: "f'(x)=3x²-3=3(x-1)(x+1)。驻点 x=-1、1。计算 f(-2)=-1，f(-1)=3，f(1)=-1，f(2)=3，故最大值为 3，最小值为 -1。",
        analysis: "求导后没有比较区间端点，误以为极值点一定是最值。",
        difficulty: 3,
        source: "2026 成都二诊 · 数学第 18 题",
        tags: ["导数", "最值", "函数"],
        image: "",
        createdAt: day(-2),
        nextReviewAt: todayStr,
        rep: 0,
        ease: 2.5,
        interval: 1,
        reviews: [],
      },
      {
        id: "q2",
        subjectId: "math",
        kpIds: ["ma-trig"],
        question: "把函数 y=sin(2x+π/3) 的图像向右平移 π/6 个单位，所得图像对应的函数为？",
        answer: "y=sin[2(x-π/6)+π/3]=sin2x。",
        analysis: "平移时没有先提取系数 2，误写成 sin(2x+π/3-π/6)。",
        difficulty: 2,
        source: "周测 · 三角函数",
        tags: ["图像平移", "三角函数"],
        image: "",
        createdAt: day(-6),
        nextReviewAt: day(-1),
        rep: 1,
        ease: 2.3,
        interval: 2,
        reviews: [{ date: day(-4), score: 3 }],
      },
      {
        id: "q3",
        subjectId: "physics",
        kpIds: ["ph-newton"],
        question: "质量为 m 的物体在倾角为 θ 的粗糙斜面上匀速下滑，求斜面对物体的摩擦力大小。",
        answer: "沿斜面方向平衡：f=mgsinθ。",
        analysis: "把摩擦力误写成 μmgcosθ，但题目只要求匀速平衡，不一定要用 μ。",
        difficulty: 2,
        source: "课堂例题 · 受力分析",
        tags: ["受力分析", "平衡"],
        image: "",
        createdAt: day(-15),
        nextReviewAt: todayStr,
        rep: 2,
        ease: 2.5,
        interval: 4,
        reviews: [
          { date: day(-14), score: 4 },
          { date: day(-10), score: 3 },
        ],
      },
      {
        id: "q4",
        subjectId: "chemistry",
        kpIds: ["ch-equilibrium"],
        question: "对已达平衡的可逆反应 N2+3H2⇌2NH3，增大压强，平衡如何移动？",
        answer: "正反应气体分子数减少，增大压强平衡向正反应方向移动。",
        analysis: "误认为所有可逆反应增压都正向移动，没有看气体系数变化。",
        difficulty: 3,
        source: "一轮复习 · 化学平衡",
        tags: ["勒夏特列原理", "平衡移动"],
        image: "",
        createdAt: day(-8),
        nextReviewAt: todayStr,
        rep: 1,
        ease: 2.5,
        interval: 2,
        reviews: [{ date: day(-6), score: 2 }],
      },
      {
        id: "q5",
        subjectId: "biology",
        kpIds: ["bi-genetics"],
        question: "豌豆高茎(D)对矮茎(d)为显性，Dd×Dd 后代高茎与矮茎的比例是？",
        answer: "基因型 DD:Dd:dd=1:2:1，高茎:矮茎=3:1。",
        analysis: "把基因型比例 1:2:1 直接当作表现型比例。",
        difficulty: 2,
        source: "遗传规律练习",
        tags: ["分离定律", "概率"],
        image: "",
        createdAt: day(-3),
        nextReviewAt: todayStr,
        rep: 0,
        ease: 2.5,
        interval: 1,
        reviews: [],
      },
      {
        id: "q6",
        subjectId: "chinese",
        kpIds: ["ch-yanwenzici"],
        question: "翻译“既其出，则或咎其欲出者”。",
        answer: "已经出来之后，就有人责怪那个想要出来的人。",
        analysis: "“既”译成“既然”而不是“已经”，“其”的指代关系没有理清。",
        difficulty: 4,
        source: "文言文翻译专项",
        tags: ["实词", "虚词"],
        image: "",
        createdAt: day(-20),
        nextReviewAt: day(-3),
        rep: 2,
        ease: 2.2,
        interval: 7,
        reviews: [
          { date: day(-19), score: 2 },
          { date: day(-12), score: 3 },
        ],
      },
      {
        id: "q7",
        subjectId: "english",
        kpIds: ["en-attributive"],
        question: "This is the house ______ windows face south. 选择关系词。",
        answer: "whose。先行词 house 与 windows 是所属关系。",
        analysis: "看到物就选 which，忽略从句中缺少的是定语 whose。",
        difficulty: 3,
        source: "语法填空练习",
        tags: ["定语从句", "关系词"],
        image: "",
        createdAt: day(-7),
        nextReviewAt: todayStr,
        rep: 1,
        ease: 2.4,
        interval: 2,
        reviews: [{ date: day(-5), score: 3 }],
      },
      {
        id: "q8",
        subjectId: "geography",
        kpIds: ["ge-climate"],
        question: "地中海气候夏季高温少雨的主要成因是什么？",
        answer: "夏季受副热带高气压带控制，盛行下沉气流，降水少。",
        analysis: "只写“夏季少雨”，没有写出气压带风带成因。",
        difficulty: 3,
        source: "区域地理 · 气候",
        tags: ["气候成因", "气压带风带"],
        image: "",
        createdAt: day(-4),
        nextReviewAt: day(1),
        rep: 0,
        ease: 2.5,
        interval: 1,
        reviews: [],
      },
    ];

    const tasks = [
      {
        id: "task1",
        date: todayStr,
        subjectId: "math",
        title: "数学：函数与导数限时训练 20 题",
        duration: 45,
        type: "custom",
        completed: false,
      },
      {
        id: "task2",
        date: todayStr,
        subjectId: "english",
        title: "英语：高考核心词汇 30 个",
        duration: 20,
        type: "custom",
        completed: false,
      },
    ];

    return {
      profile: {
        studentName: "陶可馨",
        gaokaoDate: "2027-06-07",
        targetScore: 620,
      },
      subjects,
      knowledgePoints,
      questions,
      tasks,
    };
  };
})();
