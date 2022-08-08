#    		               Lab Week 07 实验报告

**实验内容**：**进程间通信 — Linux System Call 共享内存**

- 实验内容：建立一个足够大的共享内存空间结构 (lock, M)，逻辑值 lock 用来保证同一时间只有一个进程进入 M；测试在你的系统上 M 的容量上限。
- 设计一个程序，在 M 上建立一个结点信息结构为 (flag, 学号, 姓名) 的列表 L，逻辑值 flag 用作结点的删除标识；在 L 上建立一个以学号为关键字的二元小顶堆，自行设计结点的控制结构 (如静态指针数据域)。
- 设计一个程序对上述堆结构的结点实现插入、删除、修改、查找、排序等操作。该程序的进程可以在同一主机的多个终端并发执行。
- 思考：使用逻辑值 lock 实现的并发机制不能彻底解决访问冲突问题。



# I. 实验过程：

### 1.测试系统上共享内存空间M的容量上限：

通过指令 ``ipcs -l`` 查看系统中共享内存空间大小的限制

<img src="https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937577.png" alt="image-20220328224653258" style="zoom: 67%;" />

可以看到，max total shared memory为18014398442373116 kbytes；

接下来通过修改``shmget()`` 函数中指定的共享内存空间大小的参数，来对共享内存进行动态的大小测试。



**实验代码：**

> shmdata.h

```c
#define TEXT_SIZE 1024 /* = PAGE_SIZE, size of each message */
#define TEXT_NUM 5      /* maximal number of mesages */

typedef struct student{
    int flag;
    int id;
    char name[TEXT_SIZE];
}student;

struct shared_struct{
    int lock;
    char mtext[TEXT_SIZE]; /* buffer for message reading and writing */
    
};

#define PERM S_IRUSR|S_IWUSR|IPC_CREAT

#define ERR_EXIT(m) \
    do { \
        perror(m); \
        exit(EXIT_FAILURE); \
    } while(0)

```

>  tester.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <sys/shm.h>
#include <fcntl.h>

#include "shmdata.h"

int main(int argc, char *argv[]){
    struct stat fileattr;

    key_t key;
    int shmid;
    void *shmptr;
    long long shmsize, ret;
    struct shared_struct *shared;

    pid_t childpid1, childpid2;
    char pathname[99],cmd_str[80];

    int bufsize;
    char* buffer;

    shmsize = sizeof(struct shared_struct);
    printf("current shm size = %lld\n",shmsize);

    if(argc <2) {
        printf("Usage: ./a.out pathname\n");
        return EXIT_FAILURE;
    }
    sprintf(cmd_str, "ipcs -m | grep '%d'\n", shmid); 

    strcpy(pathname, argv[1]);

    if(stat(pathname, &fileattr) == -1) {
        ret = creat(pathname, O_RDWR);  
        if (ret == -1) {
            ERR_EXIT("creat()");
        }
        printf("shared file object created\n");
    }

    key = ftok(pathname, 0x27);
    if(key == -1) {
        ERR_EXIT("shmcon: ftok()");
    }
    printf("key generated: IPC key = 0x%x\n", key);
    printf("Testing the maximum capacity of shared memory...\n");

    while(1){
        shmid = shmget((key_t)key, shmsize, 0666|PERM);
        if(shmid == -1) {
            printf("creating shared memory fail, the current size is %lld, which is over the limits.\n",shmsize);
            ERR_EXIT("shmcon: shmget()");
            break;
        }
        printf("creating shared memory success, the current size is %lld\n",shmsize);
        if (shmctl(shmid, IPC_RMID, 0) == -1) {
            ERR_EXIT("shmctl(IPC_RMID)");
        }
       
            shmsize*=2;
    }

    exit(EXIT_SUCCESS);
}
```

**代码说明：**通过将共享内存空间的大小不断乘2，这样执行下去直到函数``shmget()`` 返回错误信息，可以得到系统中共享内存大小的限制值。



**实验结果：**

![image-20220328225125353](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937959.png)

通过不断地将初始定义的共享内存大小的值乘2，探测出共享内存大小的一个上界为275951648768，随后从值137975824384出发，求出其上确界：

![image-20220328225703396](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937212.png)

通过将值137975824384不断加1000000，得出上确界140019704384。



### 2.在 M 上建立一个结点信息结构为 (flag, 学号, 姓名) 的列表 L，逻辑值 flag 用作结点的删除标识；在 L 上建立一个以学号为关键字的二元小顶堆



**实验代码：**

> shmdata.h

```c
#define TEXT_SIZE 1024 /* = PAGE_SIZE, size of each message */
#define TEXT_NUM 5      /* maximal number of mesages */
#define CAPACITY 10 //堆的总容量
typedef struct student{ //学生信息
    int flag;
    int id;
    char name[100];
}student;

typedef struct shared_struct{
    int lock; //lock 值为1时，当前调用进程进入休眠状态
    int size; //堆的当前大小
    student data[TEXT_SIZE];
}*Minheap;

#define PERM S_IRUSR|S_IWUSR|IPC_CREAT

#define ERR_EXIT(m) \
    do { \
        perror(m); \
        exit(EXIT_FAILURE); \
    } while(0)


```

**代码说明：**

代码中组织了二元小顶堆的数据结构，结构体student，为学生信息，结构体Minheap作为小顶堆的结构， 其中student类型的data为堆中的结点数据类型。



**实验代码：**

> heap.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <sys/shm.h>
#include <fcntl.h>

#include "shmdata.h"
void swap(student* a, student* b){
    student temp = *a;
    *a = *b;
    *b = temp;
}
void adjust(Minheap heap, int idx,int size){ //将堆向下调整
    int child = 2 * idx + 1;
    while(child < size){
        if(child + 1 < size && heap->data[child + 1].id < heap->data[child].id){
            child++;
        }
        if(heap->data[child].id < heap->data[idx].id){
            swap(&heap->data[child], &heap->data[idx]);
            idx = child;
            child = 2 * idx + 1;
        }
        else{
            break;
        }
    }
}
void adjust_up(Minheap heap, int idx, int size){ //将堆向上调整
    int parent = (idx - 1) / 2;
    while(idx > 0){
        if(heap->data[idx].id < heap->data[parent].id){
            swap(&heap->data[idx], &heap->data[parent]);
            idx = parent;
            parent = (idx - 1) / 2;
        }
        else{
            break;
        }
    }
}
void init_heap(Minheap heap){ //从最后一个非叶子节点开始，不断的向下调整
    for(int i=heap->size/2 - 1; i>=0; i--){
        adjust(heap, i, heap->size);
    }
}
int heap_push(Minheap heap, int flag, int id, char*name){ //向堆中插入元素
    if(heap->size + 1 > CAPACITY){
        return -1;
    }
    heap->data[heap->size].flag = flag;
    heap->data[heap->size].id = id;
    strcpy(heap->data[heap->size].name, name);
    heap->size++;
    return 0;
}
int heap_pop(Minheap heap){ //从堆中弹出元素
    if(heap->size == 0){
        return -1;
    }
    heap->data[0].flag = 1;
    swap(&heap->data[0], &heap->data[heap->size-1]);
    heap->size--;
    adjust(heap, 0, heap->size);
    
    return 0;
}
char* search(Minheap heap, int id){ //从堆中搜索学号对应的学生姓名
    for(int i=0;i<heap->size;i++){
        if(heap->data[i].flag == 0 && heap->data[i].id == id){
            return heap->data[i].name;
        }
    } 
    return "";
}
char* revise(Minheap heap, int id, char*name){ //从堆中修改学号对应的学生姓名
    char*old_name;
    for(int i=0;i<heap->size;i++){
            if(heap->data[i].flag == 0 && heap->data[i].id == id){
                strcpy(old_name, heap->data[i].name);
                strcpy(heap->data[i].name,name);
                return old_name;
            }
    }
    return "";
}
int main(int argc, char *argv[]){
    struct stat fileattr;

    key_t key;
    int shmid;
    void *shmptr;
    long long shmsize, ret;
    struct shared_struct *shared;

    pid_t childpid1, childpid2;
    char pathname[99],cmd_str[80];

    int bufsize;
    char* buffer;

    shmsize = sizeof(struct shared_struct);
    printf("current shm size = %lld\n",shmsize);

    if(argc <2) {
        printf("Usage: ./a.out pathname\n");
        return EXIT_FAILURE;
    }
    sprintf(cmd_str, "ipcs -m | grep '%d'\n", shmid); 

    strcpy(pathname, argv[1]);

    if(stat(pathname, &fileattr) == -1) {
        ret = creat(pathname, O_RDWR);  
        if (ret == -1) {
            ERR_EXIT("creat()");
        }
        printf("shared file object created\n");
    }

    key = ftok(pathname, 0x27);
    if(key == -1) {
        ERR_EXIT("shmcon: ftok()");
    }
    printf("key generated: IPC key = 0x%x\n", key);
    printf("Testing the maximum capacity of shared memory...\n");

    shmid = shmget((key_t)key, shmsize, 0666|PERM);
    if(shmid == -1) {
        ERR_EXIT("shmcon: shmget()");
    }
    printf("creating shared memory success, the current size is %lld\n",shmsize);

    shmptr = shmat(shmid, 0, 0);
    if(shmptr == (void *)-1) {
        ERR_EXIT("shmat()");
    }

    shared = (struct shared_struct *)shmptr;
    Minheap heap = shared;

    heap->size = 0;
    printf("The capacity of the min heap is %d\n", CAPACITY);
    while(1){
        int option;
        printf("Operations: 1:insert, 2:pop, 3:search, 4:revise, 5:sort, 6:display, 7:quit\n");
       // printf("delete and search operation should enter student followed by the indentifier\n");
        printf("Please enter your option\n");
        scanf("%d",&option);

        if(option == 1){
            printf("now, please enter student id and name, enter -1 -1 to quit inserting\n");
            while(1){
                char name[100];
                int id;
                scanf("%d%s",&id,name);
                if(id == -1) break;
                int res = heap_push(heap, 0, id, name);
                if(res == -1) {
                    printf("Push fall, Out of capacity:%d\n", CAPACITY);
                    break;
                }
                printf("You have pushed %d %s, the heap's current size is %d\n", id,name,heap->size);
            }
            printf("You have inserted the following students' information so far:\n");
            for(int i=0;i<heap->size;i++){
                if(!heap->data[i].flag)
                    printf("Student %s's ID is %d\n",heap->data[i].name,heap->data[i].id);
            }
            printf("The min heap is initialized, enter 6 to check it out!\n");
            init_heap(heap);
        }

        else if(option == 2){
            int ret = heap_pop(heap);
            if(ret == -1) printf("pop fail, heap is empty\n");
            else printf("pop success, the heap's current size is %d \n", heap->size);
        }   

        else if(option == 3){
            int id;
            printf("now, please enter the student'id who you want to search\n");
            scanf("%d",&id);
            char* stuname = search(heap, id);
            if(stuname == ""){
                printf("Sorry, the student doesn't exist\n");
            }
            else
                printf("ID %d is corresponding to student %s\n", id,stuname);
        }

        else if(option == 4){
             printf("Please enter the student's ID, and the name you want to revise \n");
                 int id;
                 char name[100];
                 scanf("%d%s",&id,name);
                 char* ret = revise(shared, id, name);
                 if(ret == ""){
                     printf("Operation fail, Student doesn't exist\n");
                 }
                 else{
                     printf("Student %d 's name has been revised from %s to %s\n",id, ret, name);
                 }
             
        }

        else if(option == 5){
            for(int i = heap->size/2-1; i>=0; i--){
                adjust(heap, i, heap->size);
            }
            int end = heap->size - 1;
            while(end > 0){
                swap(&heap->data[0], &heap->data[end]);
                adjust(heap, 0, end);
                end--;
            }
            printf("Sort success, enter 6 to check it out!\n");
        }

        else if(option == 6){
            for(int i=0;i<heap->size;i++){
                if(!heap->data[i].flag)
                    printf("Student %s's ID is %d\n",heap->data[i].name,heap->data[i].id);
            }
        }
        else {
            break;
        }
    }

    if(shmdt(shmptr) == -1) {
        ERR_EXIT("shmwrite: shmdt()");
    }
    if (shmctl(shmid, IPC_RMID, 0) == -1) {
        ERR_EXIT("shmctl(IPC_RMID)");
    }
    else {
        printf("shmid = %d removed \n", shmid);
    }
    exit(EXIT_SUCCESS);
}
```

**代码说明：**这部分是二元小顶堆的代码，定义了与堆的操作相关的函数（可见代码注释），在命令行中输入操作数可以实现其对应的堆操作。



**实验结果：**

![image-20220329220121460](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937162.png)

从打印出的信息可以看到，此时共享内存空间已经成功建立，小顶堆的大小为10，其中输入1~6分别对应6个操作



现在输入1，对小顶堆进行插入操作：

![image-20220329221154339](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937060.png)

现在，根据格式输入学生的学号和姓名，最后打印出输入的所有信息，并且将堆初始化；随后，输入6查看当前堆初始化的情况。



![image-20220329221320458](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937306.png)

从输出的信息可以看到，此时小顶堆已经成功建立，其结构如下图：

<img src="https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937629.jpg" alt="18861648563378_.pic" style="zoom:50%;" />

可见，该结构符合小顶堆的定义；



接下来对小顶堆进行排序操作，输入5:

![image-20220329221837093](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937092.png)

排序成功，堆中的元素从大到小进行排序。



接下来对小顶堆进行pop操作，输入2:

![image-20220329222011835](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937361.png)

从输出的结果来看，最大的ID数19对应的学生已经被pop出堆，从排序后的结果能更清楚地看到。



接下来对学生的姓名进行更改，这时将ID为8的学生的姓名改为NO1，输入4:

![image-20220329222323627](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011937677.png)

从输出结果来看，ID为8的学生的姓名已经成功地改为NO1



接下来进行查找操作，查找ID为10的学生对应的姓名，输入3:

![image-20220329222459571](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936226.png)

从输出结果来看，ID为10的学生的姓名为NO6，正确。



### 3.以上程序的进程在同一主机的多个终端并发执行

以上针对二元小顶堆的操作进行验证，这部分针对该程序，在多个终端上并发执行，并观察实验结果：



**实验代码：**

代码在``heap.c``的基础上增加了由lock值来对限定进入程序的进程的功能，增加了一个操作数作为休眠操作，目的是使当前正在执行程序的进程进入休眠状态，随后可以让其他进程使用该程序。

> heap_multitmnl.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <sys/shm.h>
#include <fcntl.h>

#include "shmdata.h"
void swap(student* a, student* b){
    student temp = *a;
    *a = *b;
    *b = temp;
}
void adjust(Minheap heap, int idx,int size){
    int child = 2 * idx + 1;
    while(child < size){
        if(child + 1 < size && heap->data[child + 1].id < heap->data[child].id){
            child++;
        }
        if(heap->data[child].id < heap->data[idx].id){
            swap(&heap->data[child], &heap->data[idx]);
            idx = child;
            child = 2 * idx + 1;
        }
        else{
            break;
        }
    }
}
void adjust_up(Minheap heap, int idx, int size){
    int parent = (idx - 1) / 2;
    while(idx > 0){
        if(heap->data[idx].id < heap->data[parent].id){
            swap(&heap->data[idx], &heap->data[parent]);
            idx = parent;
            parent = (idx - 1) / 2;
        }
        else{
            break;
        }
    }
}
void init_heap(Minheap heap){ //从最后一个非叶子节点开始，不断的向下调整
    for(int i=heap->size/2 - 1; i>=0; i--){
        adjust(heap, i, heap->size);
    }
}
int heap_push(Minheap heap, int flag, int id, char*name){
    if(heap->size + 1 > CAPACITY){
        return -1;
    }
    heap->data[heap->size].flag = flag;
    heap->data[heap->size].id = id;
    strcpy(heap->data[heap->size].name, name);
    heap->size++;
    return 0;
}
int heap_pop(Minheap heap){
    if(heap->size == 0){
        return -1;
    }
    heap->data[0].flag = 1;
    swap(&heap->data[0], &heap->data[heap->size-1]);
    heap->size--;
    adjust(heap, 0, heap->size);
    
    return 0;
}
char* search(Minheap heap, int id){
    for(int i=0;i<heap->size;i++){
        if(heap->data[i].flag == 0 && heap->data[i].id == id){
            return heap->data[i].name;
        }
    } 
    return "";
}
char* revise(Minheap heap, int id, char*name){
    char*old_name;
    for(int i=0;i<heap->size;i++){
            if(heap->data[i].flag == 0 && heap->data[i].id == id){
                strcpy(old_name, heap->data[i].name);
                strcpy(heap->data[i].name,name);
                return old_name;
            }
    }
    return "";
}
int main(int argc, char *argv[]){
    struct stat fileattr;

    key_t key;
    int shmid;
    void *shmptr;
    long long shmsize, ret;
    struct shared_struct *shared;

    pid_t childpid1, childpid2;
    char pathname[99],cmd_str[80];

    int bufsize;
    char* buffer;

    shmsize = sizeof(struct shared_struct);
    printf("current shm size = %lld\n",shmsize);

    if(argc <2) {
        printf("Usage: ./a.out pathname\n");
        return EXIT_FAILURE;
    }
    sprintf(cmd_str, "ipcs -m | grep '%d'\n", shmid); 

    strcpy(pathname, argv[1]);

    if(stat(pathname, &fileattr) == -1) {
        ret = creat(pathname, O_RDWR);  
        if (ret == -1) {
            ERR_EXIT("creat()");
        }
        printf("shared file object created\n");
    }

    key = ftok(pathname, 0x27);
    if(key == -1) {
        ERR_EXIT("shmcon: ftok()");
    }
    printf("key generated: IPC key = 0x%x\n", key);
    printf("Testing the maximum capacity of shared memory...\n");

    shmid = shmget((key_t)key, shmsize, 0666|PERM);
    if(shmid == -1) {
        ERR_EXIT("shmcon: shmget()");
    }
    printf("creating shared memory success, the current size is %lld\n",shmsize);

    shmptr = shmat(shmid, 0, 0);
    if(shmptr == (void *)-1) {
        ERR_EXIT("shmat()");
    }

    shared = (struct shared_struct *)shmptr;
    Minheap heap = shared;
    printf("lock:%d\n", shared->lock);
    heap->size = 0;
    printf("The capacity of the min heap is %d\n", CAPACITY);

while(shared->size < 6){ //为方便测试，当共享内存空间里二元小顶堆的结点数为6时，结束进程
     if(shared->lock == 1){
            printf("Process locking, please wait other process's termination\n");
    }
    while(shared->lock == 1){
            sleep(1);
    }
    shared->lock = 1;
    
    while(1){
        int option;
        printf("Operations: 1:insert, 2:pop, 3:search, 4:revise, 5:sort, 6:display, 7:stop 8 quit\n");
        printf("Please enter your option\n");
        scanf("%d",&option);

        if(option == 1){
            printf("now, please enter student id and name, enter -1 -1 to quit inserting\n");
            while(1){
                char name[100];
                int id;
                scanf("%d%s",&id,name);
                if(id == -1) break;
                int res = heap_push(heap, 0, id, name);
                if(res == -1) {
                    printf("Push fall, Out of capacity:%d\n", CAPACITY);
                    break;
                }
                printf("You have pushed %d %s, the heap's current size is %d\n", id,name,heap->size);
            }
            printf("You have inserted the following students' information so far:\n");
            for(int i=0;i<heap->size;i++){
                if(!heap->data[i].flag)
                    printf("Student %s's ID is %d\n",heap->data[i].name,heap->data[i].id);
            }
            printf("The min heap is initialized, enter 6 to check it out!\n");
            init_heap(heap);
        }

        else if(option == 2){
            int ret = heap_pop(heap);
            if(ret == -1) printf("pop fail, heap is empty\n");
            else printf("pop success, the heap's current size is %d \n", heap->size);
        }   

        else if(option == 3){
            int id;
            printf("now, please enter the student'id who you want to search\n");
            scanf("%d",&id);
            char* stuname = search(heap, id);
            if(stuname == ""){
                printf("Sorry, the student doesn't exist\n");
            }
            else
                printf("ID %d is corresponding to student %s\n", id,stuname);
        }

        else if(option == 4){
             printf("Please enter the student's ID, and the name you want to revise \n");
                 int id;
                 char name[100];
                 scanf("%d%s",&id,name);
                 char* ret = revise(shared, id, name);
                 if(ret == ""){
                     printf("Operation fail, Student doesn't exist\n");
                 }
                 else{
                     printf("Student %d 's name has been revised from %s to %s\n",id, ret, name);
                 }
             
        }

        else if(option == 5){
            for(int i = heap->size/2-1; i>=0; i--){
                adjust(heap, i, heap->size);
            }
            int end = heap->size - 1;
            while(end > 0){
                swap(&heap->data[0], &heap->data[end]);
                adjust(heap, 0, end);
                end--;
            }
            printf("Sort success, enter 6 to check it out!\n");
        }

        else if(option == 6){
            for(int i=0;i<heap->size;i++){
                if(!heap->data[i].flag)
                    printf("Student %s's ID is %d\n",heap->data[i].name,heap->data[i].id);
            }
        }
        else if(option == 7){
            shared->lock = 0; 
            break;
        }
        else {
            break;
        }
    }

    if(shmdt(shmptr) == -1) {
        ERR_EXIT("shmwrite: shmdt()");
    }
    if (shmctl(shmid, IPC_RMID, 0) == -1) {
        ERR_EXIT("shmctl(IPC_RMID)");
    }
    else {
        printf("shmid = %d removed \n", shmid);
    }
    exit(EXIT_SUCCESS);
}
}

```

**代码说明：**

```c
while(shared->size < 6){ //为方便测试，当共享内存空间里二元小顶堆的结点数为6时，结束进程
     if(shared->lock == 1){
            printf("Process locking, please wait other process's termination\n");
    }
    while(shared->lock == 1){
            sleep(1);
    }
    shared->lock = 1;
    
    while(1){
      int option;
      printf("Operations: 1:insert, 2:pop, 3:search, 4:revise, 5:sort, 6:display, 7:stop 8 quit\n");
      //...........
    }
```

代码中，这部分用于多进程并行运行程序时，保证同一时间只有一个进程进入该程序，为方便测试，当共享内存空间里二元小顶堆的结点数为6时，结束进程；当lock 值为1时，禁止调用进程访问共享内存空间。



**实验结果：**

![image-20220330144009234](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936476.png)

实验时，开启了三个终端，分别为T1、T2和T3，其中一个终端对应的进程进入该程序中，而其他终端对应的进程受到阻塞，需要等待第一个终端结束调用程序后才能进入该程序，如果当前调用程序的进程输入7，表示进入休眠状态，此时其他访问该程序但受到阻塞的进程才可以进行访问。

现在对小顶堆进行插入操作，输入1：

![image-20220330144251485](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936038.png)

向二元小顶堆中插入5个学生的信息后，进行排序，从最后的结果来看，学生的学号从大到小进行排列，此时其他终端的进程仍保持在阻塞状态。



在终端T1中查找学号为50的学生，输入3:

![image-20220330144415502](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936721.png)

学号50对应的学生姓名为No4，正确。



在终端T1进行Pop操作，输入2:

![image-20220330144450156](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936838.png)

可见，学号最大的学生，对应学号为50，已经从堆中弹出。



现在将终端T1对应的进程进行休眠，在终端T1中输入7，执行休眠操作：

![image-20220330144544240](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936159.png)

从结果来看，终端T1对应的进程休眠后，终端T2对应的进程获得了程序的执行权。



在终端T2进行Revise操作，将学号为10的学生姓名改为No4，输入2:

![image-20220330144705804](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936193.png)

成功将学号为10的学生姓名从No5改为No4。



现在将终端T2对应的进程进行休眠，在终端T2中输入7，执行休眠操作：

![image-20220330144801378](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936359.png)

现在，终端T3的进程获得程序执行权。



在终端T3进行搜索操作，查找学号为10的学生对应的姓名，输入3：

![image-20220330144905155](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936310.png)

学号为10的学生对应的姓名为No4，正确。



现在将终端T3对应的进程进行休眠，在终端T3中输入7，执行休眠操作：

![image-20220330145027375](https://lecture07-1301936037.cos.ap-nanjing.myqcloud.com/202204011936498.png)

这时，从输出的结果可以看到，终端T1对应的进程获得了程序执行权。

以上操作可以反复进行下去，直到进程终止，从以上的运行结果可以看到，不同终端间所用的共享内存是相同的。





### 4.思考：使用逻辑值 lock 实现的并发机制不能彻底解决访问冲突问题。

这里需要分清并发和并行的区别：

**并发(concurrency)：**指在同一时刻只能有一条指令执行，但多个进程指令被快速的轮换执行，使得在宏观上具有多个进程同时执行的效果，但在微观上并不是同时执行的，只是把时间分成若干段，使多个进程快速交替的执行。根据时间片读取上下文+执行程序+保存上下文。

**并行(parallellism) :**  指两个或者多个事件在同一时刻发生，在多道程序环境下，并行性使多个程序同一时刻可在不同CPU上同时执行。

**它们虽然都说是"多个进程同时运行"，但是它们的"同时"不是一个概念。并行的"同时"是同一时刻可以多个进程在运行(处于running)，并发的"同时"是经过上下文快速切换，使得看上去多个进程同时都在运行的现象。**

回到上述程序，在while循环内，一个进程若要结束程序的执行会将`lock`值置为0，随后其他退出阻塞状态的进程会争抢执行这个程序，在这个过程中，如果是单处理器则不会出现问题，但在多处理器中，lock的赋值需要经过寄存器，并不是原子性的，所以lock的值有可能被多次访问，从而引起条件冲突。

