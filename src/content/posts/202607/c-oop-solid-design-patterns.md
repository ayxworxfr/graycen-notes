---
title: 'C 语言面向对象编程与设计模式：用纯 C 实现 SOLID 原则'
published: 2026-07-11
description: '用纯 C 实现面向对象三大特性 + SOLID 五大原则 + 6 种经典设计模式，附可编译代码示例和完整插件框架。'
image: ''
tags: [C, 面向对象, SOLID, 设计模式, OOP]
category: 技术
draft: false
lang: ''
---

> **前言**
>
> "C 是面向过程的语言，不能面向对象" —— 这是对 C 最大的误解。
>
> Linux 内核、GLib、CPython、Redis 全部用 C 写成，无一不是面向对象设计的典范。C 没有 `class` 关键字，但拥有实现 OOP 的全部底层能力：**结构体 = 数据封装，函数指针 = 多态，结构体嵌套 = 继承**。
>
> 本文将系统展示：如何用纯 C 实现面向对象三大特性 + SOLID 五大原则 + 6 种经典设计模式。
>
> 📖 参考：Linux 内核设备模型、GObject 类型系统、RT-Thread 设备框架

---

## 目录

1. [SOLID 原则在 C 中的映射](#一solid-原则在-c-中的映射)
2. [三大基石：封装、继承、多态](#二三大基石封装继承多态)
3. [设计模式实战](#三设计模式实战)
4. [综合实例：一个完整的插件框架](#四综合实例一个完整的插件框架)
5. [常见问题与最佳实践](#五常见问题与最佳实践)

---

## 一、SOLID 原则在 C 中的映射

| SOLID 原则 | 含义 | C 语言实现手段 |
|:---|:---|:---|
| **S** — 单一职责 | 一个模块只有一个变化原因 | 一个 `.c` 文件 = 一个模块，只管一件事 |
| **O** — 开闭原则 | 对扩展开放，对修改关闭 | 函数指针表（新增实现不改已有代码） |
| **L** — 里氏替换 | 子类可替换父类 | 所有"子类"结构体首成员嵌入"父类" |
| **I** — 接口隔离 | 不强迫依赖不需要的接口 | 拆分多个小的 ops 结构体 |
| **D** — 依赖倒置 | 高层不依赖低层，都依赖抽象 | 通过接口（函数指针）交互，不直接调用 |

下面逐一展开，每条原则都有可编译的代码示例。

---

## 二、三大基石：封装、继承、多态

### 2.1 封装（Encapsulation）

**核心思想：** 隐藏内部实现，只暴露操作接口。

#### 手法一：不透明指针（Opaque Pointer）

```c
/* ========== stack.h — 外界只知道"存在这个类型" ========== */
#pragma once
#include <stdbool.h>

typedef struct stack stack_t;    /* 前向声明，内部不可见 */

stack_t *stack_create(int capacity);
void     stack_destroy(stack_t *s);
bool     stack_push(stack_t *s, void *item);
void    *stack_pop(stack_t *s);
void    *stack_peek(const stack_t *s);
int      stack_size(const stack_t *s);
bool     stack_is_empty(const stack_t *s);
```

```c
/* ========== stack.c — 结构体定义只存在于此 ========== */
#include "stack.h"
#include <stdlib.h>

struct stack {
    void **items;       /* 外部完全无法访问这些字段 */
    int    capacity;
    int    top;
};

stack_t *stack_create(int capacity) {
    stack_t *s = malloc(sizeof(stack_t));
    if (!s) return NULL;
    s->items = malloc(sizeof(void *) * capacity);
    s->capacity = capacity;
    s->top = -1;
    return s;
}

bool stack_push(stack_t *s, void *item) {
    if (s->top >= s->capacity - 1) return false;
    s->items[++s->top] = item;
    return true;
}

/* ... 其余实现 ... */
```

> 💡 **效果：** 外部代码不可能写出 `s->top = 999` 这种越权操作。修改内部数据结构（如改为链表实现），不需要重编任何引用方。

#### 手法二：static 隐藏模块私有函数

```c
/* utils.c */

/* static 函数 = private 方法，文件外不可见 */
static int calculate_hash(const char *key) {
    /* ... 内部算法 ... */
}

static void resize_table(hashtable_t *ht) {
    /* ... 内部操作 ... */
}

/* 非 static = public 方法 */
int hashtable_insert(hashtable_t *ht, const char *key, void *value) {
    int hash = calculate_hash(key);   /* 内部调用 */
    /* ... */
}
```

---

### 2.2 继承（Inheritance）

**C 的继承手法：结构体首成员嵌入。**

原理：C 标准保证结构体首成员地址 = 结构体本身地址。因此"父类"指针和"子类"指针可以互相安全转换。

```c
/* ========== 定义"基类" Shape ========== */
typedef struct shape shape_t;

typedef struct {
    double (*area)(const shape_t *self);
    double (*perimeter)(const shape_t *self);
    void   (*draw)(const shape_t *self);
    void   (*destroy)(shape_t *self);
} shape_ops_t;

struct shape {
    const shape_ops_t *ops;     /* 虚函数表 */
    const char        *name;
    int                x, y;    /* 公共属性 */
};

/* "基类"方法：通过 ops 转发 */
static inline double shape_area(const shape_t *s) {
    return s->ops->area(s);
}
static inline double shape_perimeter(const shape_t *s) {
    return s->ops->perimeter(s);
}
static inline void shape_draw(const shape_t *s) {
    s->ops->draw(s);
}
```

```c
/* ========== "子类" Circle ========== */
typedef struct {
    shape_t base;       /* ← 首成员是基类，实现"继承" */
    double  radius;     /* 子类特有属性 */
} circle_t;

/* 子类方法实现 */
static double circle_area(const shape_t *self) {
    const circle_t *c = (const circle_t *)self;   /* 安全向下转型 */
    return 3.14159265 * c->radius * c->radius;
}

static double circle_perimeter(const shape_t *self) {
    const circle_t *c = (const circle_t *)self;
    return 2.0 * 3.14159265 * c->radius;
}

static void circle_draw(const shape_t *self) {
    const circle_t *c = (const circle_t *)self;
    printf("Drawing circle at (%d,%d) r=%.1f\n",
           self->x, self->y, c->radius);
}

static void circle_destroy(shape_t *self) {
    free(self);
}

/* 子类的虚函数表（静态常量，全局只一份）*/
static const shape_ops_t circle_ops = {
    .area      = circle_area,
    .perimeter = circle_perimeter,
    .draw      = circle_draw,
    .destroy   = circle_destroy,
};

/* 子类"构造函数" */
shape_t *circle_create(int x, int y, double radius) {
    circle_t *c = malloc(sizeof(circle_t));
    c->base.ops  = &circle_ops;
    c->base.name = "Circle";
    c->base.x    = x;
    c->base.y    = y;
    c->radius    = radius;
    return (shape_t *)c;    /* 返回基类指针 */
}
```

```c
/* ========== "子类" Rectangle ========== */
typedef struct {
    shape_t base;       /* 继承 */
    double  width;
    double  height;
} rectangle_t;

static double rect_area(const shape_t *self) {
    const rectangle_t *r = (const rectangle_t *)self;
    return r->width * r->height;
}

static double rect_perimeter(const shape_t *self) {
    const rectangle_t *r = (const rectangle_t *)self;
    return 2.0 * (r->width + r->height);
}

static void rect_draw(const shape_t *self) {
    const rectangle_t *r = (const rectangle_t *)self;
    printf("Drawing rect at (%d,%d) w=%.1f h=%.1f\n",
           self->x, self->y, r->width, r->height);
}

static const shape_ops_t rect_ops = {
    .area      = rect_area,
    .perimeter = rect_perimeter,
    .draw      = rect_draw,
    .destroy   = circle_destroy,    /* 析构逻辑相同可复用 */
};

shape_t *rectangle_create(int x, int y, double w, double h) {
    rectangle_t *r = malloc(sizeof(rectangle_t));
    r->base.ops  = &rect_ops;
    r->base.name = "Rectangle";
    r->base.x    = x;
    r->base.y    = y;
    r->width     = w;
    r->height    = h;
    return (shape_t *)r;
}
```

---

### 2.3 多态（Polymorphism）

有了上面的基础，多态就是自然而然的事：

```c
int main(void) {
    /* 创建不同"子类"对象，用统一的"基类"指针管理 */
    shape_t *shapes[] = {
        circle_create(0, 0, 5.0),
        rectangle_create(1, 2, 4.0, 6.0),
        circle_create(3, 3, 2.5),
    };
    int n = sizeof(shapes) / sizeof(shapes[0]);

    /* 多态调用：同一个接口，不同行为 */
    for (int i = 0; i < n; i++) {
        printf("[%s] area=%.2f perimeter=%.2f\n",
               shapes[i]->name,
               shape_area(shapes[i]),
               shape_perimeter(shapes[i]));
        shape_draw(shapes[i]);
    }

    /* 统一销毁 */
    for (int i = 0; i < n; i++) {
        shapes[i]->ops->destroy(shapes[i]);
    }
    return 0;
}
```

**输出：**
```
[Circle] area=78.54 perimeter=31.42
Drawing circle at (0,0) r=5.0
[Rectangle] area=24.00 perimeter=20.00
Drawing rect at (1,2) w=4.0 h=6.0
[Circle] area=19.63 perimeter=15.71
Drawing circle at (3,3) r=2.5
```

> 💡 **这就是 C 的多态。** 调用方只认识 `shape_t *`，不需要 `#include` 任何子类头文件。新增一个 `triangle_t` 不改已有任何代码——**满足开闭原则（O）**。

---

### 2.4 三大特性总结

```
┌─────────────────────────────────────────────────────────┐
│                    C 的面向对象模型                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  封装 = opaque pointer + static 函数                     │
│  继承 = 结构体首成员嵌入                                   │
│  多态 = 函数指针表（vtable）                              │
│                                                         │
│  构造 = xxx_create() 函数                                │
│  析构 = xxx_destroy() 函数                               │
│  this = 第一个参数 self                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、设计模式实战

### 3.1 策略模式（Strategy）— 满足 O（开闭）+ D（依赖倒置）

**场景：** 排序算法可切换，但调用方不关心具体用的是哪种。

```c
/* ===== 定义策略接口 ===== */
typedef int (*compare_fn)(const void *a, const void *b);

typedef struct {
    const char *name;
    void (*sort)(void *arr, int n, int elem_size, compare_fn cmp);
} sort_strategy_t;

/* ===== 具体策略实现 ===== */
static void bubble_sort_impl(void *arr, int n, int elem_size, compare_fn cmp) {
    uint8_t *base = (uint8_t *)arr;
    uint8_t *tmp = alloca(elem_size);
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            void *a = base + j * elem_size;
            void *b = base + (j + 1) * elem_size;
            if (cmp(a, b) > 0) {
                memcpy(tmp, a, elem_size);
                memcpy(a, b, elem_size);
                memcpy(b, tmp, elem_size);
            }
        }
    }
}

static void quick_sort_impl(void *arr, int n, int elem_size, compare_fn cmp) {
    qsort(arr, n, elem_size, cmp);  /* 借用标准库 */
}

/* 策略实例（全局常量）*/
const sort_strategy_t SORT_BUBBLE = { .name = "bubble", .sort = bubble_sort_impl };
const sort_strategy_t SORT_QUICK  = { .name = "quick",  .sort = quick_sort_impl  };

/* ===== 上下文（Context）===== */
typedef struct {
    const sort_strategy_t *strategy;    /* 当前策略 */
} sorter_t;

void sorter_set_strategy(sorter_t *s, const sort_strategy_t *strategy) {
    s->strategy = strategy;
}

void sorter_execute(sorter_t *s, void *arr, int n, int elem_size, compare_fn cmp) {
    printf("Using [%s] sort\n", s->strategy->name);
    s->strategy->sort(arr, n, elem_size, cmp);
}

/* ===== 使用 ===== */
int int_compare(const void *a, const void *b) {
    return *(int *)a - *(int *)b;
}

int main(void) {
    int data[] = {5, 2, 8, 1, 9, 3};
    sorter_t sorter = { .strategy = &SORT_QUICK };

    sorter_execute(&sorter, data, 6, sizeof(int), int_compare);

    /* 运行时切换策略 —— 不改任何已有代码 */
    sorter_set_strategy(&sorter, &SORT_BUBBLE);
    sorter_execute(&sorter, data, 6, sizeof(int), int_compare);
}
```

**满足的 SOLID 原则：**
- **O（开闭）：** 新增排序算法只需新定义一个 `sort_strategy_t` 实例
- **D（依赖倒置）：** `sorter_t` 依赖抽象接口（`sort_strategy_t`），不依赖具体实现
- **S（单一职责）：** 每个策略只负责一种排序算法

---

### 3.2 观察者模式（Observer）— 满足 O + D

**场景：** 事件发生时通知所有订阅者，发布者不知道谁在订阅。

```c
/* ===== 事件系统 ===== */
#define MAX_OBSERVERS 16

typedef void (*event_handler_t)(void *sender, void *event_data);

typedef struct {
    event_handler_t handlers[MAX_OBSERVERS];
    int count;
} event_t;

void event_init(event_t *evt) {
    evt->count = 0;
}

int event_subscribe(event_t *evt, event_handler_t handler) {
    if (evt->count >= MAX_OBSERVERS) return -1;
    evt->handlers[evt->count++] = handler;
    return 0;
}

void event_unsubscribe(event_t *evt, event_handler_t handler) {
    for (int i = 0; i < evt->count; i++) {
        if (evt->handlers[i] == handler) {
            evt->handlers[i] = evt->handlers[--evt->count];
            return;
        }
    }
}

void event_publish(event_t *evt, void *sender, void *data) {
    for (int i = 0; i < evt->count; i++) {
        evt->handlers[i](sender, data);
    }
}

/* ===== 使用示例 ===== */
typedef struct {
    float temperature;
    float humidity;
} sensor_data_t;

/* 发布者 */
typedef struct {
    event_t on_data_ready;     /* 事件：数据就绪 */
    event_t on_alarm;          /* 事件：报警 */
} sensor_t;

void sensor_init(sensor_t *s) {
    event_init(&s->on_data_ready);
    event_init(&s->on_alarm);
}

void sensor_update(sensor_t *s, float temp, float humi) {
    sensor_data_t data = { .temperature = temp, .humidity = humi };
    event_publish(&s->on_data_ready, s, &data);
    if (temp > 80.0f) {
        event_publish(&s->on_alarm, s, &data);
    }
}

/* 订阅者们 —— 彼此独立，互不知晓 */
void display_handler(void *sender, void *event_data) {
    sensor_data_t *d = (sensor_data_t *)event_data;
    printf("[Display] Temp=%.1f Humi=%.1f\n", d->temperature, d->humidity);
}

void logger_handler(void *sender, void *event_data) {
    sensor_data_t *d = (sensor_data_t *)event_data;
    printf("[Logger] Recording: T=%.1f H=%.1f\n", d->temperature, d->humidity);
}

void alarm_handler(void *sender, void *event_data) {
    printf("[ALARM] Temperature too high!\n");
}

int main(void) {
    sensor_t sensor;
    sensor_init(&sensor);

    /* 订阅 —— 发布者不知道谁订阅了 */
    event_subscribe(&sensor.on_data_ready, display_handler);
    event_subscribe(&sensor.on_data_ready, logger_handler);
    event_subscribe(&sensor.on_alarm, alarm_handler);

    /* 正常数据 */
    sensor_update(&sensor, 25.0f, 60.0f);
    /* 高温触发报警 */
    sensor_update(&sensor, 85.0f, 40.0f);
}
```

**输出：**
```
[Display] Temp=25.0 Humi=60.0
[Logger] Recording: T=25.0 H=60.0
[Display] Temp=85.0 Humi=40.0
[Logger] Recording: T=85.0 H=40.0
[ALARM] Temperature too high!
```

---

### 3.3 状态模式（State）— 满足 S + O

**场景：** 对象行为随状态变化，避免巨型 switch-case。

```c
/* ===== 状态接口 ===== */
typedef struct player player_t;

typedef struct {
    const char *name;
    void (*play)(player_t *p);
    void (*pause)(player_t *p);
    void (*stop)(player_t *p);
} player_state_t;

/* ===== 播放器上下文 ===== */
struct player {
    const player_state_t *state;
    char current_track[64];
};

/* ===== 状态前向声明 ===== */
extern const player_state_t STATE_STOPPED;
extern const player_state_t STATE_PLAYING;
extern const player_state_t STATE_PAUSED;

/* ===== Stopped 状态 ===== */
static void stopped_play(player_t *p) {
    printf("▶ Start playing: %s\n", p->current_track);
    p->state = &STATE_PLAYING;
}
static void stopped_pause(player_t *p) {
    printf("⚠ Already stopped, cannot pause\n");
}
static void stopped_stop(player_t *p) {
    printf("⚠ Already stopped\n");
}

const player_state_t STATE_STOPPED = {
    .name = "Stopped", .play = stopped_play,
    .pause = stopped_pause, .stop = stopped_stop,
};

/* ===== Playing 状态 ===== */
static void playing_play(player_t *p) {
    printf("⚠ Already playing\n");
}
static void playing_pause(player_t *p) {
    printf("⏸ Paused\n");
    p->state = &STATE_PAUSED;
}
static void playing_stop(player_t *p) {
    printf("⏹ Stopped\n");
    p->state = &STATE_STOPPED;
}

const player_state_t STATE_PLAYING = {
    .name = "Playing", .play = playing_play,
    .pause = playing_pause, .stop = playing_stop,
};

/* ===== Paused 状态 ===== */
static void paused_play(player_t *p) {
    printf("▶ Resumed playing\n");
    p->state = &STATE_PLAYING;
}
static void paused_pause(player_t *p) {
    printf("⚠ Already paused\n");
}
static void paused_stop(player_t *p) {
    printf("⏹ Stopped from pause\n");
    p->state = &STATE_STOPPED;
}

const player_state_t STATE_PAUSED = {
    .name = "Paused", .play = paused_play,
    .pause = paused_pause, .stop = paused_stop,
};

/* ===== 统一调用接口 ===== */
void player_play(player_t *p)  { p->state->play(p); }
void player_pause(player_t *p) { p->state->pause(p); }
void player_stop(player_t *p)  { p->state->stop(p); }

/* ===== 使用 ===== */
int main(void) {
    player_t player = {
        .state = &STATE_STOPPED,
        .current_track = "Yesterday Once More",
    };

    printf("State: %s\n", player.state->name);
    player_play(&player);    /* Stopped → Playing */
    player_pause(&player);   /* Playing → Paused */
    player_play(&player);    /* Paused → Playing */
    player_stop(&player);    /* Playing → Stopped */
    player_pause(&player);   /* Stopped: cannot pause */
}
```

> 💡 **对比 switch-case：** 新增一个状态（如 `STATE_FAST_FORWARD`），只需定义新的 `player_state_t` 实例，**不修改任何已有状态的代码**。

---

### 3.4 工厂模式（Factory）— 满足 D（依赖倒置）

**场景：** 根据类型字符串/枚举创建不同对象，调用方不依赖具体类型。

```c
/* ===== 产品接口（使用前面定义的 shape 体系）===== */

/* 工厂函数：根据名字创建对象 */
typedef shape_t *(*shape_creator_t)(int x, int y, const char *params);

typedef struct {
    const char      *type_name;
    shape_creator_t  create;
} shape_factory_entry_t;

/* ===== 工厂注册表 ===== */
#define MAX_FACTORY_ENTRIES 16

static shape_factory_entry_t s_registry[MAX_FACTORY_ENTRIES];
static int s_registry_count = 0;

void shape_factory_register(const char *type_name, shape_creator_t creator) {
    if (s_registry_count >= MAX_FACTORY_ENTRIES) return;
    s_registry[s_registry_count].type_name = type_name;
    s_registry[s_registry_count].create = creator;
    s_registry_count++;
}

shape_t *shape_factory_create(const char *type_name, int x, int y, const char *params) {
    for (int i = 0; i < s_registry_count; i++) {
        if (strcmp(s_registry[i].type_name, type_name) == 0) {
            return s_registry[i].create(x, y, params);
        }
    }
    fprintf(stderr, "Unknown shape type: %s\n", type_name);
    return NULL;
}

/* ===== 各"子类"注册自己 ===== */
static shape_t *create_circle(int x, int y, const char *params) {
    double radius = atof(params);
    return circle_create(x, y, radius);
}

static shape_t *create_rect(int x, int y, const char *params) {
    double w, h;
    sscanf(params, "%lf,%lf", &w, &h);
    return rectangle_create(x, y, w, h);
}

void shapes_register_all(void) {
    shape_factory_register("circle", create_circle);
    shape_factory_register("rectangle", create_rect);
    /* 新增形状？只需在这里加一行注册 */
}

/* ===== 使用：调用方完全不依赖具体类型 ===== */
int main(void) {
    shapes_register_all();

    /* 可以从配置文件/网络协议中读取类型名 */
    shape_t *s1 = shape_factory_create("circle", 0, 0, "5.0");
    shape_t *s2 = shape_factory_create("rectangle", 1, 1, "4.0,6.0");

    shape_draw(s1);
    shape_draw(s2);

    s1->ops->destroy(s1);
    s2->ops->destroy(s2);
}
```

---

### 3.5 单例模式（Singleton）

```c
/* 方法一：函数内 static（线程不安全，适合单线程/初始化阶段）*/
logger_t *logger_get_instance(void) {
    static logger_t instance;
    static bool initialized = false;
    
    if (!initialized) {
        instance.level = LOG_INFO;
        instance.output = stderr;
        initialized = true;
    }
    return &instance;
}

/* 方法二：pthread_once（线程安全）*/
#include <pthread.h>

static logger_t *s_instance = NULL;
static pthread_once_t s_once = PTHREAD_ONCE_INIT;

static void logger_init_once(void) {
    s_instance = malloc(sizeof(logger_t));
    s_instance->level = LOG_INFO;
    s_instance->output = stderr;
}

logger_t *logger_get_instance(void) {
    pthread_once(&s_once, logger_init_once);
    return s_instance;
}
```

---

### 3.6 装饰器模式（Decorator）— 满足 O

**场景：** 动态给 stream 添加加密、压缩、缓冲等功能，不修改原有 stream。

```c
/* ===== 基础 stream 接口（同前面的定义）===== */
typedef struct stream stream_t;
typedef struct {
    int  (*read)(stream_t *self, void *buf, int size);
    int  (*write)(stream_t *self, const void *buf, int size);
    void (*close)(stream_t *self);
} stream_ops_t;

struct stream {
    const stream_ops_t *ops;
    void               *priv;
};

/* ===== 装饰器：加密 stream ===== */
typedef struct {
    stream_t  base;          /* "继承" stream */
    stream_t *wrapped;       /* 被装饰的原始 stream */
    uint8_t   xor_key;       /* 加密密钥 */
} encrypted_stream_t;

static int encrypted_write(stream_t *self, const void *buf, int size) {
    encrypted_stream_t *es = (encrypted_stream_t *)self;
    uint8_t *tmp = malloc(size);
    
    /* 加密处理 */
    for (int i = 0; i < size; i++) {
        tmp[i] = ((const uint8_t *)buf)[i] ^ es->xor_key;
    }
    
    /* 委托给被包装的 stream */
    int ret = es->wrapped->ops->write(es->wrapped, tmp, size);
    free(tmp);
    return ret;
}

static int encrypted_read(stream_t *self, void *buf, int size) {
    encrypted_stream_t *es = (encrypted_stream_t *)self;
    int ret = es->wrapped->ops->read(es->wrapped, buf, size);
    
    /* 解密 */
    for (int i = 0; i < ret; i++) {
        ((uint8_t *)buf)[i] ^= es->xor_key;
    }
    return ret;
}

static const stream_ops_t encrypted_ops = {
    .read  = encrypted_read,
    .write = encrypted_write,
    .close = /* ... */
};

/* 包装函数：给任意 stream 加上加密能力 */
stream_t *stream_add_encryption(stream_t *inner, uint8_t key) {
    encrypted_stream_t *es = malloc(sizeof(encrypted_stream_t));
    es->base.ops = &encrypted_ops;
    es->wrapped  = inner;
    es->xor_key  = key;
    return (stream_t *)es;
}

/* ===== 使用：可以层层嵌套装饰 ===== */
stream_t *s = file_stream_open("data.bin");
s = stream_add_encryption(s, 0xAB);     /* 加密装饰 */
s = stream_add_buffering(s, 4096);      /* 缓冲装饰（类似实现）*/

stream_read(s, buf, len);   /* 透明地先解缓冲再解密 */
```

---

## 四、综合实例：一个完整的插件框架

将以上模式融合，实现一个**可注册、可扩展的命令处理框架**：

```c
/* ===== 命令接口定义 ===== */
typedef struct {
    const char *name;
    const char *help;
    int (*execute)(int argc, char **argv);
} command_t;

/* ===== 命令注册表 ===== */
#define MAX_COMMANDS 64

static const command_t *s_commands[MAX_COMMANDS];
static int s_cmd_count = 0;

void command_register(const command_t *cmd) {
    if (s_cmd_count < MAX_COMMANDS) {
        s_commands[s_cmd_count++] = cmd;
    }
}

int command_execute(const char *name, int argc, char **argv) {
    for (int i = 0; i < s_cmd_count; i++) {
        if (strcmp(s_commands[i]->name, name) == 0) {
            return s_commands[i]->execute(argc, argv);
        }
    }
    printf("Unknown command: %s\n", name);
    return -1;
}

void command_list_all(void) {
    printf("Available commands:\n");
    for (int i = 0; i < s_cmd_count; i++) {
        printf("  %-12s %s\n", s_commands[i]->name, s_commands[i]->help);
    }
}

/* ===== 各模块定义自己的命令（分散注册）===== */

/* --- 文件模块 --- */
static int cmd_ls(int argc, char **argv) {
    printf("Listing files...\n");
    return 0;
}
static int cmd_cat(int argc, char **argv) {
    if (argc < 2) { printf("Usage: cat <file>\n"); return -1; }
    printf("Content of %s: ...\n", argv[1]);
    return 0;
}
static const command_t CMD_LS  = { "ls",  "List directory", cmd_ls };
static const command_t CMD_CAT = { "cat", "Print file",     cmd_cat };

/* --- 网络模块 --- */
static int cmd_ping(int argc, char **argv) {
    if (argc < 2) { printf("Usage: ping <host>\n"); return -1; }
    printf("Pinging %s...\n", argv[1]);
    return 0;
}
static const command_t CMD_PING = { "ping", "Ping host", cmd_ping };

/* --- 系统模块 --- */
static int cmd_help(int argc, char **argv) {
    command_list_all();
    return 0;
}
static const command_t CMD_HELP = { "help", "Show all commands", cmd_help };

/* ===== 各模块注册 ===== */
void file_module_init(void) {
    command_register(&CMD_LS);
    command_register(&CMD_CAT);
}

void net_module_init(void) {
    command_register(&CMD_PING);
}

void sys_module_init(void) {
    command_register(&CMD_HELP);
}

/* ===== 主程序 ===== */
int main(void) {
    /* 各模块独立注册，互不依赖 */
    file_module_init();
    net_module_init();
    sys_module_init();

    /* 执行命令 */
    char *args1[] = {"ls"};
    command_execute("ls", 1, args1);

    char *args2[] = {"ping", "google.com"};
    command_execute("ping", 2, args2);

    command_execute("help", 0, NULL);
}
```

**SOLID 分析：**

| 原则 | 如何满足 |
|:---|:---|
| S — 单一职责 | 每个模块只管自己的命令 |
| O — 开闭原则 | 新增命令 = 新增模块 + 注册，不改框架代码 |
| L — 里氏替换 | 所有 `command_t` 都可被框架统一调用 |
| I — 接口隔离 | `command_t` 接口极简，只有必要字段 |
| D — 依赖倒置 | 框架依赖 `command_t` 接口，不依赖具体模块 |

---

## 五、常见问题与最佳实践

### 5.1 模式对比速查表

| 模式 | 核心结构 | 解决什么问题 | C 实现手法 |
|:---|:---|:---|:---|
| **策略** | 接口 + 多个实现 | 算法可替换 | 函数指针结构体 |
| **观察者** | 事件 + 订阅列表 | 一对多通知解耦 | 回调数组 |
| **状态** | 状态接口 + 状态切换 | 消灭 switch-case | 每状态一个 ops |
| **工厂** | 注册表 + 创建函数 | 创建与使用解耦 | 函数指针注册 |
| **装饰器** | 包装 + 委托 | 动态叠加功能 | 结构体嵌套 + 转发 |
| **单例** | 静态实例 + 访问函数 | 全局唯一对象 | static + once |

### 5.2 何时用、何时不用

```
✅ 用面向对象的场景：
   • 同类对象有多种实现（驱动、协议、算法）
   • 需要运行时切换行为
   • 模块间需要松耦合
   • 系统需要可扩展性

❌ 不要过度设计的场景：
   • 只有一种实现且未来不会变化
   • 简单的数据处理流水线
   • 性能关键路径（虚函数调用有间接跳转开销）
   • 代码总量 < 500 行的小工具
```

### 5.3 性能考量

```c
/* 函数指针调用 vs 直接调用 */

/* 直接调用：编译器可内联，分支预测友好 */
int result = concrete_function(data);

/* 间接调用：多一次内存读取 + 无法内联 */
int result = obj->ops->do_something(obj, data);

/* 
 * 开销：约 1~5ns（现代 CPU），绝大多数场景可忽略
 * 真正的性能瓶颈从来不在这里，而在算法和 I/O
 * 但在超高频热路径（每秒千万次），请 benchmark 验证
 */
```

### 5.4 类型安全强化技巧

```c
/* 问题：void * 丢失了类型信息，容易误用 */

/* 技巧：用宏生成类型安全的容器 */
#define DEFINE_TYPED_LIST(name, type)                            \
    typedef struct {                                             \
        type   *items;                                          \
        int     count;                                          \
        int     capacity;                                       \
    } name##_list_t;                                            \
                                                                \
    static inline void name##_list_push(name##_list_t *l, type item) { \
        if (l->count >= l->capacity) { /* resize... */ }        \
        l->items[l->count++] = item;                            \
    }                                                           \
    static inline type name##_list_get(name##_list_t *l, int i) {     \
        return l->items[i];                                     \
    }

/* 使用 */
DEFINE_TYPED_LIST(int, int)
DEFINE_TYPED_LIST(point, point_t)

int_list_t numbers = {0};
int_list_push(&numbers, 42);       /* 类型安全 */
// int_list_push(&numbers, "hello"); /* 编译错误！*/
```

---

## 总结：C 语言 OOP 的核心公式

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  类         =  结构体 + 操作函数（第一参数为 self）           │
│  私有成员   =  定义在 .c 中（opaque pointer）                │
│  继承       =  子类结构体首成员 = 父类结构体                  │
│  多态       =  函数指针表（const ops 结构体）                 │
│  构造/析构  =  xxx_create() / xxx_destroy()                 │
│  接口       =  只含函数指针的结构体                           │
│  抽象类     =  ops 中有些函数指针允许为 NULL                  │
│                                                             │
│  SOLID 的核心实现手段 = 函数指针 + 注册机制 + 分层隔离        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**记住：面向对象是一种思想，不是一种语法。** C 没有语法糖的辅助，反而让你更深刻地理解 OOP 的本质——**封装是为了管理复杂度，多态是为了可扩展性，继承是为了代码复用**。

当你用 C 手动实现这些机制时，你对 OOP 的理解将超越 90% 只会用 `class` 关键字的人。

---

*写 C 的面向对象，不是为了模仿 C++，而是为了让代码结构清晰、职责分明、易于扩展。这就是 Linux 内核几千万行代码依然可维护的秘密。*
