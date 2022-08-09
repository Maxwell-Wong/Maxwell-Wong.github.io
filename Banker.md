#  银行家算法与进程同步

## I.银行家算法(Banker's Algorithm)

银行家算法是操作系统用于避免死锁的算法，仿照银行发放贷款的控制过程，**试探性地**分配系统资源，再进行安全性检查，判断分配是否安全（会不会导致死锁），若不安全则取消分配，让进程继续等待。



在算法中，主要以六个数据结构来完成，包括三个一维数组和三个二维数组，用于给出当前系统的状态，不妨以N表示当前的进程数，M表示可分配的资源类型，定义：

``int resource[M]`` 、``int available[M]`` 、``int request[M]``、``int max[N][M]``、 ``int allocation[N][M]``、``int need[N][M]`` 

- ``resource[i]`` 表示第i个可分配的资源的类型

- ``available[i]`` 表示第i个资源的可用量

- ``request[i]``表示本次进程对第i个资源的申请量

- ``max[i][j]`` 表示进程i对资源j的最大需求量

-  ``allocation[i][j]``表示进程i得到资源j的数量

- ``need[i][j]`` 表示进程i对资源j还需要的资源量

当进程$P_i$向系统提出资源申请时，需要进行以下检查：

(1) 若``Request[i] <= Need[i]``  则转(2) ，否则报错；

(2)若``Request[i] <= Avaliable`` 则转(3)，否则进程进入等待状态；

(3) 那么，假设系统分配了资源给进程，产生新的状态，则有：

```c
Avaliale = Avaliable - Request[i];
Allocation[i] = Allocation[i] + Request[i];
Need[i] = Need[i] - Request[i];
```

此外，在进程申请资源的过程中，还需要进行安全性检查，寻找安全序列，若系统新状态是安全的，则分配完成；反之则需要**恢复原来的状态**，进程进入等待状态。

**安全性检查步骤：**

定义数据结构：``int work[M]`` 和``bool finish[N]`` ：

- ``work[i]``表示第i类资源当前的假定可用量（ ``work[i] = available[i] - request[i]`` ）
- ``finish[j]`` 表示第j个进程是否完成安全性检查

**检查步骤伪代码：**

（1）数据结构初始化

```c
work[i] = avaliable[i]; // 让work为当前资源的可用量
finish[j] = false;  // finish初始化为false，表示未完成安全性检查
```



（2）循环判断

```c
a. finish[i] == false; //
b. need[i] <= work;
//若都不满足，转(4)
```



（3）对资源进行回收

```c
work = work + allocation; //回收后的资源为可用资源+已分配资源
finish[i] = true; //已检查
//转（2）继续判断其它进程
```



（4）最终判断

```c
finish[i] == true //若对所有进程都有该条件成立，则系统处于安全状态
//否则处于不安全状态，因为资源分配给该进程后，没有一个进程能够完成并释放资源，最终将导致死锁。
```

最后返回一个安全序列，如{P0，P3，P2，P1}，表示系统当前的剩余资源work，先分配给进程P0，再进行回收``work+=allocation[p0]``

再分配给进程P3，再进行回收``work += allocation[p3]`` ，以此类推，最终满足所有进程。



**例程代码：**



> resource_request函数

```c
int resource_request(int pro_i)
{
    int j, k, ret;
    
    for (k = 0;  k < M; k++) {
        if(request[k] > need[pro_i][k]) {
            printf("request[%d] > need[%d][%d]: request[%d] = %d, need[%d][%d] = %d\n", k, pro_i, k, k, request[k], pro_i, k, need[pro_i][k]);
            return EXIT_FAILURE;
        }
    }

    for (k = 0; k < M; k++) {
        if(request[k] > available[k]) {
            printf("request[%d] > available[%d]: request[%d] = %d, available[%d] = %d\n", k, k, k, request[k], k, available[k]);
            return EXIT_FAILURE;
        }
    }

    for (k = 0; k < M; k++) {
        work[k] = available[k] - request[k]; /* work[] as the pretending available[] */
    }

    ret = safecheck(pro_i); /* check whether the pretending state is safe */

    if(ret == EXIT_SUCCESS) { /* confirm the pretending state as the new state */
        for (k = 0; k < M; k++) {
            available[k] -= request[k];
            need[pro_i][k] -= request[k];
            allocation[pro_i][k] += request[k];
        }
    }

    return ret;
}
```

**代码说明：**

这部分代码完成了对资源的分配情求的判断以及调用安全性检测函数，判断该请求是否安全；

1.如果进程对资源的请求量>该进程对资源的需求量，则返回错误；

2.如果进程对资源的请求量>该资源的可用量，返回错误；

其中还对work数组进行初始化，`` work[k] = available[k] - request[k]`` 让work为“试探”的剩余量（avaliavle）到安全性检测函数中进行检测，如果检测结果为安全，则进行状态更新，执行相应的操作：

```c
available[k] -= request[k];
need[pro_i][k] -= request[k];
allocation[pro_i][k] += request[k];
```



> safecheck函数

```c
int safecheck(int pro_i)
{
    int finish[N] = {FALSE};
    int safe_seq[N] = {0};
    int i, j, k, l;

    printf("\nsafecheck starting >>>>>>>>\n");

    for (i = 0; i < N; i++) { /* we need to select N processes, i is just a counter */
        for (j = 0; j < N; j++) { /* check the j-th process */
            if(finish[j] == FALSE) {
                if(j == pro_i) {
                    for (k = 0; k < M; k++) {
                        if(need[pro_i][k] - request[k] > work[k]) { /* if pretending need[pro_i] > work[] */
                            break; /* to check next process */
                        }
                    }
                } else {
                    for (k = 0; k < M; k++) {
                        if(need[j][k] > work[k]) {
                            break; /* to check next process */
                        }
                    }
                }

                if(k == M) { /* the j-th process can finish its task */
                    safe_seq[i] = j;
                    finish[j] = TRUE;
                    printf("safe_seq[%d] = %d\n", i, j);
                    printf("new work vector: ");
                    if(j == pro_i) {
                        for (l = 0; l < M; l++) { /* process pro_i releasing pretending allocated resources */
                            work[l] = work[l] + allocation[pro_i][l] + request[l];
                            printf("%d, ", work[l]);
                        }
                    } else {
                        for (l = 0; l < M; l++) { /* another process releasing allocated resource */
                            work[l] = work[l] + allocation[j][l];
                            printf("%d, ", work[l]);
                        }
                    }
                    printf("\n");

                    break; /* to select more process */
                }
            }
        }

        if(j == N) {
            break; /* not enough processes can pass the safecheck */
        }
    }

    if(i == N) { /* all N processes passed the safecheck */
        printf("A safty sequence is: ");
        for (j = 0; j < N; j++) {
            printf("P%d, ", safe_seq[j]);
        }
        printf("\n");
        return EXIT_SUCCESS;
    }
    else {
        printf("safecheck failed, process %d suspended\n", pro_i);
        return EXIT_FAILURE;
    }
}


```

**代码说明：**

这部分代码完成了银行家算法中的安全性检查；

在一开始，已经输入某个进程Pi对资源的需求量，保存在数组``request[M]`` 中，同时也有了``work[M]`` 数组；

接下来，就是对N个进行进程安全性检查，先逐部分分析：

首先，对N个进行进行循环判断，如果该进程未完成安全性检查，即`finish[j] == FALSE` ，进行如下检测：

```c
if(finish[j] == FALSE) {
  if(j == pro_i) {
     for (k = 0; k < M; k++) {
           if(need[pro_i][k] - request[k] > work[k]) { /* if pretending need[pro_i] > work[] */
              break; /* to check next process */
                              //当前无法满足该进程需求
              }
     }else {
         for (k = 0; k < M; k++) {
             if(need[j][k] > work[k]) { //如果需求量大于剩余量
                              break; /* to check next process */
           }
     }
  }
     if(k == M) { /* the j-th process can finish its task */
       safe_seq[i] = j; // 加入安全序列中
       finish[j] = TRUE; // 已检查
       printf("safe_seq[%d] = %d\n", i, j);
       printf("new work vector: ");
       if(j == pro_i) {
         for (l = 0; l < M; l++) { /* process pro_i releasing pretending allocated resources */
           work[l] = work[l] + allocation[pro_i][l] + request[l];
           printf("%d, ", work[l]);
         }
       } else {
         for (l = 0; l < M; l++) { /* another process releasing allocated resource */
           work[l] = work[l] + allocation[j][l];
           printf("%d, ", work[l]);
         }
       }
       printf("\n");

       break; /* to select more process */
     }
    /*.......*/
}
```

在这里，如果当前遍历到的进程为要进行获取资源的进程``pro_i``，则进行判断``need[pro_i][k] - request[k] > work[k]``，这表示如果该**进程对资源的需求量 - 请求量 > 剩余资源量**（这里是进行 “探测” 的量），则**当前剩余的资源量无法完成进程所需的工作**，也无法释放该进程的资源，同理对于其它进程如果``need[j][k] > work[k]`` ，也无法完成该进程的工作，那么对这些进程来说，就无法通过安全性检查。

反之，如果该进程能完成它的工作，那么它就是安全的，将其加入安全序列中，再进行资源回收``work[l] = work[l] + allocation[pro_i][l] + request[l]``（进程pro_i) 或者``work[l] = work[l] + allocation[j][l]`` （其它进程），对work进行更新后，再对后续的进程进行如上的判断。

如果所有进程都能通过安全检查，则会输出对应的安全序列``safe_seq`` ；



**运行结果：**

初始状态，现在输入要进行操作的进程号（输入0）。

![image-20220515154449924](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205151544610.png)

首先是初始状态，当前系统中预设有3类资源，可用的资源数为avaliavle = 10, 5, 7，共有5个进程Pro0 ~ Pro4，已经分配的资源量和需求量分别由allocation和need给出。



输入进程P0需要的类型资源数，分别为3，3，3

![image-20220515154857500](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205151548794.png)

输出以当前剩余系统资源数作为work向量，对5个进程的safecheck过程。最后得到系统新的状态，资源剩余量分别为7，2，4

安全序列为P0, P1, P2, P3, P4



现在对进程P1进行操作，获取资源量3，1， 2

![image-20220515155318464](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205151553880.png)

这时safe check的work向量为系统剩余资源量7， 2， 4，安全序列为P1, P0, P2, P3, P4



对进程4进行操作，获取系统资源4，1，3

![image-20220515165700515](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205151657937.png)

这时资源3资源不足，剩余资源量为2，而请求资源量为3。



对进程1进行操作，获取系统资源1，1，1

![image-20220515165846980](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205151658040.png)

这时资源的请求量大于进程对资源的需求量。



对进程1进行操作，获取系统资源0，1，0

![image-20220515170047956](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205151700084.png)

成功分配资源给进程1。





# II.进程同步

> 多线程程序中操作的原子性

原子操作和非原子操作：



### 1.相关函数

> \_\_sync\_\_原子家族

```c
// 将value加到*ptr上，结果更新到*ptr，并返回操作之前*ptr的值
type __sync_fetch_and_add (type *ptr, type value); 

// 从*ptr减去value，结果更新到*ptr，并返回操作之前*ptr的值
type __sync_fetch_and_sub (type *ptr, type value, ...) 

// 将*ptr与value相或，结果更新到*ptr， 并返回操作之前*ptr的值
type __sync_fetch_and_or (type *ptr, type value, ...) 

// 将*ptr与value相与，结果更新到*ptr，并返回操作之前*ptr的值
type __sync_fetch_and_and (type *ptr, type value, ...) 

// 将*ptr与value异或，结果更新到*ptr，并返回操作之前*ptr的值
type __sync_fetch_and_xor (type *ptr, type value, ...) 

// 将*ptr取反后，与value相与，结果更新到*ptr，并返回操作之前*ptr的值
type __sync_fetch_and_nand (type *ptr, type value, ...) 

// 将value加到*ptr上，结果更新到*ptr，并返回操作之后新*ptr的值
type __sync_add_and_fetch (type *ptr, type value, ...) 

// 从*ptr减去value，结果更新到*ptr，并返回操作之后新*ptr的值
type __sync_sub_and_fetch (type *ptr, type value, ...) 

// 将*ptr与value相或， 结果更新到*ptr，并返回操作之后新*ptr的值
type __sync_or_and_fetch (type *ptr, type value, ...) 

// 将*ptr与value相与，结果更新到*ptr，并返回操作之后新*ptr的值
type __sync_and_and_fetch (type *ptr, type value, ...) 

// 将*ptr与value异或，结果更新到*ptr，并返回操作之后新*ptr的值
type __sync_xor_and_fetch (type *ptr, type value, ...)

// 将*ptr取反后，与value相与，结果更新到*ptr，并返回操作之后新*ptr的值
type __sync_nand_and_fetch (type *ptr, type value, ...) 

// 比较*ptr与oldval的值，如果两者相等，则将newval更新到*ptr并返回true
bool __sync_bool_compare_and_swap (type *ptr, type oldval type newval, ...)

// 比较*ptr与oldval的值，如果两者相等，则将newval更新到*ptr并返回操作之前*ptr的值
type __sync_val_compare_and_swap (type *ptr, type oldval type newval, ...) 

// 发出完整内存栅栏
__sync_synchronize (...) 

// 将value写入ptr，对ptr加锁，并返回操作之前ptr的值。
type __sync_lock_test_and_set (type ptr, type value, ...)

// 将0写入到ptr，并对*ptr解锁。
void __sync_lock_release (type ptr, ...)


```



### 2.例程代码运行：



##### 同步的原子操作

> alg.18-1-syn-fetch-demo.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define MAX_N 40

static int count_1 = 0;
static int count_2 = 0;

void *thread_func1(void *arg)
{

    for (int i = 0; i < 20000; ++i) {
        __sync_fetch_and_add(&count_1, 1);
    }

    pthread_exit(NULL);
}

void *thread_func2(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        count_2++;
    }

    pthread_exit(NULL);
}

int main(void)
{
    pthread_t ptid_1[MAX_N];
    pthread_t ptid_2[MAX_N];

    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_1[i], NULL, &thread_func1, NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_2[i], NULL, &thread_func2, NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_1[i], NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_2[i], NULL);
    }

    printf("result conut_1 = %d\n", count_1);
    printf("result conut_2 = %d\n", count_2);

    return 0;
}


```

**代码说明：**

在``thread_func1()``函数中，执行20000次循环，每次调用原子操作`` __sync_fetch_and_add(&count_1, 1)`` 对count_1进行加1操作，

而在``thread_func2()``函数中，只进行了count_2++的操作，该操作并不是原子操作，从其对应的汇编代码可知，**这一步操作需要在原子上分成3步，分别是将count_2从内存读取到寄存器中，然后再加1，最后将值写回内存，**所以在这过程中，线程间容易产生冲突，进而产生错误结果。



**运行结果**

![image-20220516111359234](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205161114667.png)

显然，从结果可以看到在``thread_func1()``函数中，调用了原子操作所进行运算的结果是正确的，而在``thread_func2()``函数中，得到的结果是错误的。



> alg.18-1-syn-fetch.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

int main(void)
{
    uint8_t i, val;
    
    i = 30; val = 10;
	printf("__sync_fetch_and_add(&i, val)\n");
	printf("old i = %d, val = %d, ", i, val);
	printf("ret = %d, ", __sync_fetch_and_add(&i, val));
    printf("new i = %d\n\n", i);
    
    i = 30; val = 10;
	printf("__sync_add_and_fetch(&i, val)\n");
	printf("old i = %d, val = %d, ", i, val);
	printf("ret = %d, ", __sync_add_and_fetch(&i, val));
    printf("new i = %d\n\n", i);

    i = 30; val = 10;
	printf("__sync_fetch_and_sub(&i, val)\n");
	printf("old i = %d, val = %d, ", i, val);
	printf("ret = %d, ", __sync_fetch_and_sub(&i, val));
    printf("new i = %d\n\n", i);
    
    i = 0x16; val = 0x2A;
	printf("__sync_fetch_and_or(&i, val)\n"); /* 00010110 | 00101010 */
    printf("old i = 0x%x, val = 0x%x, ", i, val);
	printf("ret = 0x%x, ", __sync_fetch_and_or(&i, val));
    printf("new i = 0x%x\n\n", i);
    
    i = 0x16; val = 0x2A;
	printf("__sync_fetch_and_and(&i, val)\n"); /* 00010110 & 00101010 */
    printf("old i = 0x%x, val = 0x%x, ", i, val);
	printf("ret = 0x%x, ", __sync_fetch_and_and(&i, val));
    printf("new i = 0x%x\n\n", i);
    
    i = 0x16; val = 0x2A;
	printf("__sync_fetch_and_xor(&i, val)\n"); /* 00010110 ^ 00101010 */
    printf("old i = 0x%x, val = 0x%x, ", i, val);
	printf("ret = 0x%x, ", __sync_fetch_and_xor(&i, val));
    printf("new i = 0x%x\n\n", i);
    
    i = 0x16; val = 0x2A;
	printf("__sync_fetch_and_nand(&i, val)\n"); /* ~(00010110 & 00101010) */
    printf("old i = 0x%x, val = 0x%x, ", i, val);
	printf("ret = 0x%x, ", __sync_fetch_and_nand(&i, val));
    printf("new i = 0x%x\n\n", i);
    
	return 0;
}



```

**代码说明：**

在这部分代码中，调用了\_\_sync\_\_家族的原子操作，并打印出计算结果；

`` __sync_fetch_and_add(&i, val)``实现的是先取出i的值，再加上val对应的值，最后返回i未改变前的值，而``__sync_add_and_fetch(&i, val)``则相反，先把i加上val对应的值，最后返回i改变后的值。



**运行结果**![image-20220518124948283](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205181249052.png)

![image-20220516111540749](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205161115743.png)

可以看到执行完`` __sync_fetch_and_add(&i, val)``实现的是先取出i的值30，再加上val对应的值10，最后返回i未改变前的值30，最后打印出的i的值为40；而``__sync_add_and_fetch(&i, val)``则先把i = 30 加上val对应的值10，最后返回i改变后的值40。



> alg.18-2-syn-compare.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

int main(void)
{
    uint8_t i, oldval, newval;
    
    i = 30; oldval = 30; newval = 40;
    printf("__sync_bool_compare_and_swap(&i, oldval, newval)\n");
    printf("i = %d, oldval = %d, newval = %d\n", i, oldval, newval);
    printf("ret = %d, ", __sync_bool_compare_and_swap(&i, oldval, newval));
    printf("new i = %d\n", i);
    i = 30; oldval = 10; newval = 40;
    printf("__sync_bool_compare_and_swap(&i, oldval, newval)\n");
    printf("i = %d, oldval = %d, newval = %d\n", i, oldval, newval);
    printf("ret = %d, ", __sync_bool_compare_and_swap(&i, oldval, newval));
    printf("new i = %d\n\n", i);
 
    i = 30; oldval = 30; newval = 40;
    printf("__sync_val_compare_and_swap(&i, oldval, newval)\n");
    printf("i = %d, oldval = %d, newval = %d\n", i, oldval, newval);
    printf("ret = %d, ", __sync_val_compare_and_swap(&i, oldval, newval));
    printf("new i = %d\n", i);
    i = 30; oldval = 10; newval = 40;
    printf("__sync_val_compare_and_swap(&i, oldval, newval)\n");
    printf("i = %d, oldval = %d, newval = %d\n", i, oldval, newval);
    printf("ret = %d, ", __sync_val_compare_and_swap(&i, oldval, newval));
    printf("new i = %d\n\n", i);

    i = 30; newval = 10;
    printf("__sync_lock_test_and_set(&i, newval)\n");
    printf("i = %d, newval = %d\n", i, newval);
    printf("ret = %d, ", __sync_lock_test_and_set(&i, newval));
    printf("new i = %d\n", i);

    i = 30;
    printf("__sync_lock_release(&i)\n");
    printf("i = %d\n", i);
    __sync_lock_release(&i); /* no return value */
    printf("new i = %d\n", i);

    return 0;
}


```

**代码说明：**

``__sync_bool_compare_and_swap(&i, oldval, newval)``为原子的比较和交换，如果i的值与oldval的值相同，则将newval的值赋给i，然后返回True，反之则返回False；

`` __sync_val_compare_and_swap(&i, oldval, newval)`` 的原理与上面的函数相同，只是返回值变成了i在改变之前的值；



``__sync_lock_test_and_set(&i, newval)`` newval写入i中，并且对i加锁，返回操作之前的i值；

`__sync_lock_release(&i)` 将0写入i中，并对其解锁；

**运行结果**

![image-20220516111851981](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205161118339.png)

从结果可以看到，第一次调用`` __sync_bool_compare_and_swap(&i, oldval, newval)`` 的i值和oldval值相同，那么newval的值40就会赋给i，所以最后i = 40；而第二次调用则相反，所以newval的值不会赋给i，且注意到函数的返回值为交换成功与否对应的bool值

第一次调用`` __sync_val_compare_and_swap(&i, oldval, newval)`` 的i值和oldval值相同，那么newval的值40就会赋给i，所以最后i = 40；而第二次调用则相反，所以newval的值不会赋给i，且注意到函数的返回值正是i在改变之前的值；

``__sync_lock_test_and_set(&i, newval)`` newval写入i中，并且对i加锁，注意到new_i = 10，且返回操作之前的i值30；

`__sync_lock_release(&i)` 将0写入i中，并对其解锁，注意到new_i = 0；





> alg.18-3-syn-pthread-mutex.c

##### POSIX 互斥锁

**Mutex（互斥锁）属于sleep-waiting类型的锁**。例如在一个双核的机器上有两个线程（线程A和线程B）,它们分别运行在Core0和Core1上。假设线程A想要通过pthread_mutex_lock操作去得到一个临界区的锁，而此时这个锁正被线程B所持有，那么线程A就会被阻塞，Core0会在此时进行上下文切换(Context Switch)将线程A置于等待队列中，此时Core0就可以运行其它的任务而不必进行忙等待。

互斥锁的上下文切换可能需要相当长的时间，如果使用锁的时间极短，相比之下上下文切换就是一笔巨大的开销。

```c
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
//#include <string.h>

#define MAX_N 40

static int count_1 = 0;
static int count_2 = 0;

pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
    /* or declared: 
       pthread_mutex_t mutex;
       and in main():
       pthread_mutex_init(&mutex, NULL); */

void *thread_func1(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        pthread_mutex_lock(&mutex);
        count_1++;
        pthread_mutex_unlock(&mutex);
    }

    pthread_exit(NULL);
}

void *thread_func2(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        count_2++;
    }

    pthread_exit(NULL);
}

int main(void)
{
    pthread_t ptid_1[MAX_N];
    pthread_t ptid_2[MAX_N];

//    pthread_mutex_init(&mutex, NULL);

    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_1[i], NULL, &thread_func1, NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_2[i], NULL, &thread_func2, NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_1[i], NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_2[i], NULL);
    }

    pthread_mutex_destroy(&mutex);

    printf("result count_1 = %d\n", count_1);
    printf("result count_2 = %d\n", count_2);

    return 0;
}


```

**代码说明：**

互斥锁通过``pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER``来进行静态初始化，PTHREAD_MUTEX_INITIALIZER是结构体常量，或者使用``pthread_mutex_init(&mutex, NULL)``来进行动态初始化；

在thread_func1函数中，采用了互斥锁来解决临界区冲突问题：

```c
void *thread_func1(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        pthread_mutex_lock(&mutex);
        count_1++;
        pthread_mutex_unlock(&mutex);
    }

    pthread_exit(NULL);
}
```

在20000次的for循环中，每次循环都通过``pthread_mutex_lock(&mutex)`` 来获得锁，再对count_1进行加1操作，再`` pthread_mutex_unlock(&mutex)``释放锁，在这个过程中线程间不会出现冲突问题；

而在thread_fun2函数中，没有采用互斥锁机制，线程在调用该函数时会产生冲突；

最后调用`pthread_mutex_destroy(&mutex)`来释放互斥锁。



**运行结果**

![image-20220516113317304](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205161133778.png)

从结果来看，在thread_func1函数中执行自增操作的count_1的结果是正确的，而在thread_func2函数中的count_2产生了冲突，结果不正确。



##### POSIX 信号量

```c
#include <fcntl.h>
#include <sys/stat.h>
#include <semaphore.h>
sem_t *sem_open(const char *name, int oflag);
sem_t *sem_open(const char *name, int oflag, mode_t mode, unsigned int value);
```

**1.命名信号量** ：可以在进程间共享（与命名管道类似，通常用于进程间通信）

> alg.18-4-syn-pthread-sem-named.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>

#define MAX_N 40

sem_t *named_sem; /* global long int pointer */

static int count_1 = 0;
static int count_2 = 0;

void *thread_func1(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        sem_wait(named_sem);
        count_1++;
        sem_post(named_sem);
    }

    pthread_exit(NULL);
}

void *thread_func2(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        count_2++;
    }

    pthread_exit(NULL);
}

int main(void)
{
    pthread_t ptid_1[MAX_N];
    pthread_t ptid_2[MAX_N];

    int i, ret;

    named_sem = sem_open("MYSEM", O_CREAT, 0666, 1);
        /* a file named "sem.MYSEM" is created in /dev/shm/ 
           to be shared by processes who can sense the file name */

    if(named_sem == SEM_FAILED) {
        perror("sem_open()");
        return EXIT_FAILURE;
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_1[i], NULL, &thread_func1, NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_2[i], NULL, &thread_func2, NULL);
    }

    for (i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_1[i], NULL);
    }

    for (i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_2[i], NULL);
    }

    printf("result count_1 = %d\n", count_1);
    printf("result count_2 = %d\n", count_2);

    sem_close(named_sem);
    sem_unlink("MYSEM"); /* remove sem.MYSEM from /dev/shm/ when its references is 0 */

    return 0;
}


```

**代码说明：**

函数`sem_open()`用于创建新的或打开已经存在的信号量： ``named_sem = sem_open("MYSEM", O_CREAT, 0666, 1)`` 创建了一个名为“MYSEM”的信号量，初始值为1，返回值为信号量描述符；

在``thread_func1()``函数中，同样是20000次循环，每次都调用``sem_wait(named_sem)``来获取信号量，信号量减1（P操作），之后进入临界区执行count_1++，最后调用``sem_post(named_sem)`` 释放信号量，信号量加1（V操作）

最后执行`` sem_close(named_sem)``来关闭信号量。



**运行结果**

![image-20220516164117597](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205161641867.png)

从结果来看，在thread_func1函数中使用了信号量进行同步所执行自增操作的count_1的结果是正确的，而在thread_func2函数中的count_2产生了冲突，结果不正确。



**2.匿名信号量** ：（通常用于线程间通信）

```c
int sem_init(sem_t *sem, int pshared, unsigned int value)
// 参数为： 1）信号量的指针 2）表示共享级别的标志 3）信号量的初始值
//pshared = 0表示此信号量只能由属于创建该信号量的同一进程的线程共享。
  
```

> alg.18-5-syn-pthread-sem-unnamed.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>

#define MAX_N 40

sem_t unnamed_sem; /* global long int */

static int count_1 = 0;
static int count_2 = 0;

void *thread_func1(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        sem_wait(&unnamed_sem);
        count_1++;
        sem_post(&unnamed_sem);
    }

    pthread_exit(NULL);
}

void *thread_func2(void *arg)
{
    for (int i = 0; i < 20000; ++i) {
        count_2++;
    }

    pthread_exit(NULL);
}

int main(void)
{
    pthread_t ptid_1[MAX_N];
    pthread_t ptid_2[MAX_N];

    int i, ret;

    ret = sem_init(&unnamed_sem, 0, 1);
    if(ret == -1) {
        perror("sem_init()");
        return EXIT_FAILURE;
    }
    
    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_1[i], NULL, &thread_func1, NULL);
    }

    for (int i = 0; i < MAX_N; ++i) {
        pthread_create(&ptid_2[i], NULL, &thread_func2, NULL);
    }

    for (i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_1[i], NULL);
    }

    for (i = 0; i < MAX_N; ++i) {
        pthread_join(ptid_2[i], NULL);
    }

    printf("result count_1 = %d\n", count_1);
    printf("result count_2 = %d\n", count_2);

    sem_destroy(&unnamed_sem);

    return 0;
}


```

**代码说明：**

函数`sem_init()`用于初始化信号量，将信号量标识符``sem_t unnamed_sem``的地址 传入： `` ret = sem_init(&unnamed_sem, 0, 1)`` 创建了一个初始值为1的信号量，且这个信号量只属于该进程。

在``thread_func1()``函数中，同样是20000次循环，每次都调用``sem_wait(named_sem)``来获取信号量，信号量减1（P操作），之后进入临界区执行count_1++，最后调用``sem_post(named_sem)`` 释放信号量，信号量加1（V操作）

最后执行`` sem_destroy(named_sem)``来销毁信号量。



**运行结果**

![image-20220516171152795](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205161711932.png)

从结果来看，在thread_func1函数中使用了信号量进行同步所执行自增操作的count_1的结果是正确的，而在thread_func2函数中的count_2产生了冲突，结果不正确。



##### 生产者与消费者问题

> alg.18-6-syn-pc-con-6.c

```c
/*  compiling with -pthread
    
    this version works properly
	file list:  syn-pc-con-7.h
		        syn-pc-con-7.c
		        syn-pc-producer-7.c
		        syn-pc-consumer-7.c
    with process shared memory and semaphores
    BUFFER_SIZE, MAX_ITEM_NUM, THREAD_PROD and THREAD_CONS got from input
*/

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>
#include <string.h>
#include <sys/shm.h>
#include <semaphore.h>
#include <wait.h>
#include "alg.18-6-syn-pc-con-7.h"

int shmid;
void *shm = NULL;
int detachshm(void);
int random_code(unsigned int);

int main(void)
{
    int buffer_size, max_item_num, thread_prod, thread_cons;
    char code_str[10], pathname[80];
    int fd;
    key_t key;
    int ret;
    struct ctl_pc_st *ctl_ptr = NULL;
    struct data_pc_st *data_ptr = NULL;
    pid_t childpid, prod_pid, cons_pid;
		
    while (1) { /* env. initialization */
        printf("Pls input the number of items as the buffer bound(1-100, 0 quit): ");
        scanf("%d", &buffer_size);
        if(buffer_size <= 0)
            return 0;
        if(buffer_size > 100)
            continue;
        printf("Pls input the max number of items to be produced(1-10000, 0 quit): ");
        scanf("%d", &max_item_num);
        if(max_item_num <= 0)
            return 0;
        if(max_item_num > 10000)
            continue;
        printf("Pls input the number of producers(1-500, 0 quit): ");
        scanf("%d", &thread_prod);
        if(thread_prod <= 0)
            return 0;
        printf("Pls input the number of consumers(1-500, 0 quit): ");
        scanf("%d", &thread_cons);
        if(thread_cons <= 0)
            return 0;

        break;
    }
    
    sprintf(code_str, "%d", random_code(4));
    strcpy(pathname, "/tmp/shm-");
    strcat(pathname, code_str);
    printf("shm pathname: %s\n", pathname);
    fd = open(pathname, O_CREAT);
	if(fd == -1) {
        perror("pathname fopen()");
        return EXIT_FAILURE;
    }

    if((key = ftok(pathname, 0x28)) < 0) { 
        perror("ftok()");
        exit(EXIT_FAILURE);
    }
    
      /* get the shared memoey
         'invalid argument' if the size exceeds the current shmmax.
	     when the shmid exists, its size is defined when it was firstly declared and can not be changed.
	     if you want a lager size, you have to alter a new key for a new shmid.
      */
    shmid = shmget((key_t)key, (buffer_size + BASE_ADDR)*sizeof(struct data_pc_st), 0666 | IPC_CREAT);
    if(shmid == -1) {
        perror("shmget()");
        exit(EXIT_FAILURE);
    }

      /* attach the created shared memory to user space */
    shm = shmat(shmid, 0, 0);
    if(shm == (void *)-1) {
        perror("shmat()");
        exit(EXIT_FAILURE);
    }

      /* set the shared memory, initialize all control parameters */
    ctl_ptr = (struct ctl_pc_st *)shm;
    data_ptr = (struct data_pc_st *)shm;

    ctl_ptr->BUFFER_SIZE = buffer_size;
    ctl_ptr->MAX_ITEM_NUM = max_item_num;
    ctl_ptr->THREAD_PROD = thread_prod;
    ctl_ptr->THREAD_CONS = thread_cons; 
    ctl_ptr->prod_num = 0;
    ctl_ptr->cons_num = 0;
    ctl_ptr->enqueue = 0;
    ctl_ptr->dequeue = 0;
    ctl_ptr->END_FLAG = 0;

    ret = sem_init(&ctl_ptr->sem_mutex, 1, 1); /* pshared set to non-zero for inter process sharing */
    if(ret == -1) {
        perror("sem_init-mutex");
        return detachshm();
    }
    ret = sem_init(&ctl_ptr->sem_stock, 1, 0); /* initialize to 0 */
    if(ret == -1) {
        perror("sem_init-stock");
        return detachshm();
    }
    ret = sem_init(&ctl_ptr->sem_emptyslot, 1, ctl_ptr->BUFFER_SIZE); /*initialize to BUFFER_SIZE */
    if(ret == -1) {
        perror("sem_init-emptyslot");
        return detachshm();
    }

    printf("\nsyn-pc-con console pid = %d\n", getpid());

    char *argv1[3];
    char execname[] = "./";
    char shmidstring[10];
    sprintf(shmidstring, "%d", shmid);
    argv1[0] = execname;
    argv1[1] = shmidstring;
    argv1[2] = NULL;
        
    childpid = vfork();
    if(childpid < 0) {
        perror("first fork");
        detachshm();
        unlink(pathname);
        return 0;
    } 
    else if(childpid == 0) { /* call the producer */ 
        prod_pid = getpid();
        printf("producer pid = %d, shmid = %s\n", prod_pid, argv1[1]);
        execv("./alg.18-7-syn-pc-producer-7.out", argv1);
    }
    else {
        childpid = vfork();
        if(childpid < 0) {
            perror("second vfork");
            detachshm();
            unlink(pathname);
            return 0;
        } 
        else if(childpid == 0) { /* call the consumer */
            cons_pid = getpid();
            printf("consumer pid = %d, shmid = %s\n", cons_pid, argv1[1]);
            execv("./alg.18-8-syn-pc-consumer-7.out", argv1);
        }
    }

    if(waitpid(prod_pid, 0, 0) != prod_pid) {/* block wait */
        perror("wait prod");
    } else {
        printf("waiting prod_pid %d success.\n", prod_pid);
    }

    if (waitpid(cons_pid, 0, 0) != cons_pid) {
        perror("wait cons");
    } else {
        printf("waiting cons_pid %d success.\n", cons_pid);
    }

    ret = sem_destroy(&ctl_ptr->sem_mutex);
    if(ret == -1) {
        perror("sem_destroy sem_mutex");
    }
    ret = sem_destroy(&ctl_ptr->sem_stock); /* sem_destroy() will not affect the sem_wait() calling process */
    if(ret == -1) {
        perror("sem_destroy stock");
    }
    ret = sem_destroy(&ctl_ptr->sem_emptyslot);
    if(ret == -1) {
        perror("sem_destroy empty_slot");
    }

    detachshm();
    unlink(pathname);
    return EXIT_SUCCESS;
}

int detachshm(void)
{
    if(shmdt(shm) == -1) {
        perror("shmdt()");
        exit(EXIT_FAILURE);
    }

    if(shmctl(shmid, IPC_RMID, 0) == -1) {
        perror("shmctl(IPC_RMID)");
        exit(EXIT_FAILURE);
    }

    return EXIT_SUCCESS;
}

int random_code(unsigned int code_len)
{
	int code_val;
	long int modulus = 1;
	
	for (int i = 0; i < code_len; i++) {
		modulus = modulus * 10;
	}
	
	srand(time(NULL));
    while (1) {
        code_val = rand() % modulus;
        if(code_val > modulus / 10 - 1) {
            break;
        }
    }
    
	return code_val;
}


```

**代码说明：**

> 队列的操作： (enqueue | dequeue) % buffer_size + BASE_ADDR

首先，需要用户输入缓冲区大小、生产项目数量、生产者数量和消费者数量；

然后调用` shmid = shmget((key_t)key, (buffer_size + BASE_ADDR)*sizeof(struct data_pc_st), 0666 | IPC_CREAT)`根据前面随机生成的文件名获得的key来创建一个共享内存空间，大小为`(buffer_size + BASE_ADDR)*sizeof(struct data_pc_st)`；

再调用`` shm = shmat(shmid, 0, 0)`` 将共享内存区映射到调用进程的地址空间，让本进程访问；

然后设置共享内存，分别是控制结构体和数据结构体，这两个结构体将与后面vfork出来的子进程共享：

```
ctln = (struct ctln_pc_st *)shm;
data = (struct data_pc_st *)shm;
```



之后对控制结构体中的互斥信号量、缓冲区存储数量信号量、缓冲区中空闲单元数目信号量进行初始化：

```
ret = sem_init(&ctln->sem_mutex, 1, 1)
ret = sem_init(&ctln->stock, 1, 0);
ret = sem_init(&ctln->emptyslot, 1, ctln->BUFFER_SIZE);
```

注意到，互斥信号量(ctln->sem_mutex)的初始化中pshare指定为1（非0），表明这用于进程间共享，并初始化为1；

缓冲区存储数量的信号量(ctln->stock)同样pshare为1，并初始化为0；

表示缓冲区中空闲单元数目的信号量(ctln->emptyslot)初始化为BUFFER_SIZE

初始化工作完成之后，通过vfork()来创建进程，进而用``execv()``来调用生产者和消费者程序，即`` execv("./alg.18-8-syn-pc-consumer-7.out", argv1)``和`` execv("./alg.18-7-syn-pc-producer-7.out", argv1)``这里的argv1参数为shmid；



**生产者：**

> alg.18-7-syn-pc-producer-7.c

```c
/*  compiling with -pthread

    this version works properly
    file list:  syn-pc-con-7.h
                syn-pc-con-7.c
                syn-pc-producer-7.c
                syn-pc-consumer-7.c
    with process shared memory and semaphores
*/

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <sys/shm.h>
#include <semaphore.h>
#include <unistd.h>
#include <sys/syscall.h>
#include "alg.18-6-syn-pc-con-7.h"
#define gettid() syscall(__NR_gettid)

struct ctl_pc_st *ctl_ptr = NULL;
struct data_pc_st *data_ptr = NULL;

static int item_sn;
int random_code(unsigned int);

void *producer(void *arg)
{
  
  //当已经生产的产品数量小于所要生产的产品数量时，进入生产循环
    while (ctl_ptr->prod_num < ctl_ptr->MAX_ITEM_NUM) {
        //这里的sem_emptyslot在此前被初始化为BUFFER_SIZE
        sem_wait(&ctl_ptr->sem_emptyslot); //若缓冲区的空闲单元信号量大于0，则可以存放产品，这里将该信号量减1，否则需要等待
        sem_wait(&ctl_ptr->sem_mutex); //若互斥信号量小于1，则需要等待，这里将该信号量减1
        if(ctl_ptr->prod_num < ctl_ptr->MAX_ITEM_NUM) {
            ctl_ptr->prod_num++;	//产品数加1
            (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->prod_tid = gettid(); // 将产品的线程号和序列号入队
            (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->item_sn = item_sn++;
            printf("producer tid %ld prepared item_sn %d, now enqueue = %d\n", (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->prod_tid, (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->item_sn, ctl_ptr->enqueue);
            ctl_ptr->enqueue = (ctl_ptr->enqueue + 1) % ctl_ptr->BUFFER_SIZE;
          //当已经生产的产品数量等于所要生产的产品数量时，将结束标志END_FLAG置为1
            if(ctl_ptr->prod_num == ctl_ptr->MAX_ITEM_NUM) { 
                ctl_ptr->END_FLAG = 1;
		    }
            sem_post(&ctl_ptr->sem_stock);  //将缓冲区存储数量的信号量加1
        } else { //当已经生产的产品数量不小于所要生产的产品数量时，将表示缓冲区的空闲单元信号量加1
            sem_post(&ctl_ptr->sem_emptyslot);  //
        }
        sem_post(&ctl_ptr->sem_mutex); // 释放互斥信号量，允许其它线程访问临界区
        usleep(random_code(6));
    }

    pthread_exit(NULL);
}

int main(int argc, char *argv[])
{
    int shmid;
    void *shm = NULL;
    int i, ret;

    shmid = strtol(argv[1], NULL, 10); /* shmid delivered */
    shm = shmat(shmid, 0, 0);
    if(shm == (void *)-1) {
        perror("\nproducer shmat()");
        exit(EXIT_FAILURE);
    }

    ctl_ptr = (struct ctl_pc_st *)shm;
    data_ptr = (struct data_pc_st *)shm;

    pthread_t ptid[ctl_ptr->THREAD_PROD];

    item_sn = random_code(8);

    for (i = 0; i < ctl_ptr->THREAD_PROD; ++i) {
        ret = pthread_create(&ptid[i], NULL, &producer, NULL);
        if(ret != 0) {
            perror("producer pthread_create()");
            break;
        }
    }    

    for (i = 0; i < ctl_ptr->THREAD_PROD; ++i) {
        pthread_join(ptid[i], NULL);
    }

    for (i = 0; i < ctl_ptr->THREAD_CONS - 1; ++i) {
      /* all producers stop working, in case some consumer takes the last stock
         and no more than THREAD_CON-1 consumers stick in the sem_wait(&stock) */
        sem_post(&ctl_ptr->sem_stock);
    }
    
    if(shmdt(shm) == -1) {
        perror("producer shmdt()");
        exit(EXIT_FAILURE);
    }

    exit(EXIT_SUCCESS);
}

int random_code(unsigned int code_len)
{
	int code_val;
	long int modulus = 1;
	
	for (int i = 0; i < code_len; i++) {
		modulus = modulus * 10;
	}
	
	srand(time(NULL));
    while (1) {
        code_val = rand() % modulus;
        if(code_val > modulus / 10 - 1) {
            break;
        }
    }
    
	return code_val;
}

```

**代码说明：**

这部分代码对应的是THREAD_PROD个生产者线程进行异步生产的程序，当条件``ctl_ptr->prod_num < ctl_ptr->MAX_ITEM_NUM``满足，即已经生产的产品数量小于所要生产的产品数量时，循环调用生产代码，将对应的产品插入循环队列中，当``ctl_ptr->prod_num == ctl_ptr->MAX_ITEM_NUM`` 时，即已经生产的产品数量等于所要生产的产品数量时结束生产。

具体的细节在代码的注释中进行描述；



**消费者：**

> alg.18-8-syn-pc-consumer-7

```c
/*  compiling with -pthread

    this version works properly
    file list:  syn-pc-con-7.h
                syn-pc-con-7.c
                syn-pc-producer-7.c
                syn-pc-consumer-7.c
    with process shared memory and semaphores 
*/

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <sys/shm.h>
#include <semaphore.h>
#include <unistd.h>
#include <sys/syscall.h>
#include "alg.18-6-syn-pc-con-7.h"
#define gettid() syscall(__NR_gettid)

struct ctl_pc_st *ctl_ptr = NULL;
struct data_pc_st *data_ptr = NULL;

int random_code(unsigned int);

void *consumer(void *arg)
{
   //当消费者已经消费的产品数小于生产者生产的产品数或者生产者还没生产结束时
    while ((ctl_ptr->cons_num < ctl_ptr->prod_num) || (ctl_ptr->END_FLAG == 0))  { 
      //当缓冲区产品存储数量的信号量大于0时，表示当中有产品可以消费，将该信号量减1
        sem_wait(&ctl_ptr->sem_stock);  /* if stock is empty and all producers stop working at this point, one or more consumers may wait forever */
      //若互斥信号量不小于1，则进入临界区，否则需要等待。
        sem_wait(&ctl_ptr->sem_mutex);
      //当消费者已经消费的产品数小于生产者生产的产品数
        if (ctl_ptr->cons_num < ctl_ptr->prod_num) { 
            printf("\t\t\t\tconsumer tid %ld taken item_sn %d by tid %ld, now dequeue = %d\n", gettid(), (data_ptr + ctl_ptr->dequeue + BASE_ADDR)->item_sn, (data_ptr + ctl_ptr->dequeue + BASE_ADDR)->prod_tid, ctl_ptr->dequeue);
           //将产品出队
            ctl_ptr->dequeue = (ctl_ptr->dequeue + 1) % ctl_ptr->BUFFER_SIZE;
          //消费的产品数加1
            ctl_ptr->cons_num++;
          //将表示缓冲区空闲单元的信号量加1
            sem_post(&ctl_ptr->sem_emptyslot);
          
          // 当消费者已经消费的项目数量不小于生产者已经生产的项目数量，将表示缓冲区中存储数量的信号量加1
        } else {
            sem_post(&ctl_ptr->sem_stock);
        }
      //释放互斥信号量
        sem_post(&ctl_ptr->sem_mutex);
        usleep(random_code(6));
    }
    
    pthread_exit(0);
}

int main(int argc, char *argv[])
{
    int shmid;
    void *shm = NULL;
    int i, ret;

    shmid = strtol(argv[1], NULL, 10); /* shmnid delivered */
    shm = shmat(shmid, 0, 0);
    if (shm == (void *)-1) {
        perror("consumer shmat()");
        exit(EXIT_FAILURE);
    }

    ctl_ptr = (struct ctl_pc_st *)shm;
    data_ptr = (struct data_pc_st *)shm;

    pthread_t ptid[ctl_ptr->THREAD_CONS];

    for (i = 0; i < ctl_ptr->THREAD_CONS; ++i) {
        ret = pthread_create(&ptid[i], NULL, &consumer, NULL); 
        if (ret != 0) {
            perror("consumer pthread_create()");
            break;
        }
    } 
	
    for (i = 0; i < ctl_ptr->THREAD_CONS; ++i) {
        pthread_join(ptid[i], NULL);
    }

    if (shmdt(shm) == -1) {
        perror("consumer shmdt()");
        exit(EXIT_FAILURE);
    }
    
    exit(EXIT_SUCCESS);
}

int random_code(unsigned int code_len)
{
	int code_val;
	long int modulus = 1;
	
	for (int i = 0; i < code_len; i++) {
		modulus = modulus * 10;
	}
	
	srand(time(NULL));
    while (1) {
        code_val = rand() % modulus;
        if(code_val > modulus / 10 - 1) {
            break;
        }
    }
    
	return code_val;
}



```

**代码说明：**

这部分代码对应的是THREAD_CONS个消费者线程进行异步消费的程序，当条件``ctl_ptr->cons_num < ctl_ptr->prod_num) || (ctl_ptr->END_FLAG == 0``满足，即已经消费的产品数量小于生产的产品数量或者生产还未结束时，循环调用消费代码，将对应的产品从循环队列中弹出。

具体的细节在代码的注释中进行描述；



**运行结果**

![image-20220516211405924](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205162114361.png)

从运行结果可以看到，在缓冲区大小为4、生产数量为8、生产者数量为2、消费者数量为3的基础上，生产者和消费者异步进行，直到生产者所生产的8个产品被消费者消费完，程序结束。



**代码测试：**

在生产者的代码中注释掉else部分的语句：

```c
 if(ctl_ptr->prod_num < ctl_ptr->MAX_ITEM_NUM) {
            ctl_ptr->prod_num++;	//产品数加1
            (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->prod_tid = gettid(); // 将产品的线程号和序列号入队
            (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->item_sn = item_sn++;
            printf("producer tid %ld prepared item_sn %d, now enqueue = %d\n", (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->prod_tid, (data_ptr + ctl_ptr->enqueue + BASE_ADDR)->item_sn, ctl_ptr->enqueue);
            ctl_ptr->enqueue = (ctl_ptr->enqueue + 1) % ctl_ptr->BUFFER_SIZE;
          //当已经生产的产品数量等于所要生产的产品数量时，将结束标志END_FLAG置为1
            if(ctl_ptr->prod_num == ctl_ptr->MAX_ITEM_NUM) { 
                ctl_ptr->END_FLAG = 1;
		    }
            sem_post(&ctl_ptr->sem_stock);  //将缓冲区存储数量的信号量加1
        } 
		//else { //当已经生产的产品数量不小于所要生产的产品数量时，将表示缓冲区的空闲单元信号量加1
   //         sem_post(&ctl_ptr->sem_emptyslot);  //
   //     }
```

在消费者的代码中注释掉else部分的语句：

```c
   if (ctl_ptr->cons_num < ctl_ptr->prod_num) { 
            printf("\t\t\t\tconsumer tid %ld taken item_sn %d by tid %ld, now dequeue = %d\n", gettid(), (data_ptr + ctl_ptr->dequeue + BASE_ADDR)->item_sn, (data_ptr + ctl_ptr->dequeue + BASE_ADDR)->prod_tid, ctl_ptr->dequeue);
           //将产品出队
            ctl_ptr->dequeue = (ctl_ptr->dequeue + 1) % ctl_ptr->BUFFER_SIZE;
          //消费的产品数加1
            ctl_ptr->cons_num++;
          //将表示缓冲区空闲单元的信号量加1
            sem_post(&ctl_ptr->sem_emptyslot);
          
          // 当消费者已经消费的项目数量不小于生产者已经生产的项目数量，将表示缓冲区中存储数量的信号量加1
        }
        //else {
      //      sem_post(&ctl_ptr->sem_stock);
      // }
```



在buffer bound为1，最大生产数量50，20个生产者和消费者的情况下， 发现运行进入死锁状态：

![](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205181436907.png)

![image-20220518143718005](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202205181437291.png)





