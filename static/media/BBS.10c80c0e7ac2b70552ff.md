# Lab Week 11 实验报告

**实验内容：** 代码阅读与分析

- alg.11-0-BBS-8.h
- alg.11-3-socket-input-pad-8-1.c
- alg.11-4-socket-connector-BBS-8-1.c
- alg.11-5-socket-server-BBS-nickname-8-1.c

分析并画出系统的总体功能结构图、程序流程图和数据流图。描述代码实现的进程并发行为。描述代码实现的 IPC 行为。



# I. BBS

A BBS (Bulletin Board System) prototype using ordinary pipe, named pipe and socket communication.



- #### BBS的数据流图：

![BBS_dataflowchart](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204251858280.png)



> **操作方法：**
>
> 在主机上打开两个终端窗口 w1 和 w2，在 w1 运行 server，初始化后提示 pad 连接码和本机 ip4 地址、端口号，进入监听状态。在 w2 运行 pad，按提示选择自动连接 server 或手动输入 server 提示的4个数字的连接码，连接成功后进入等待输入状态，在 pad 上输入 --help 可以得到命令提示。
>
> 在一台能够感知 server 主机 ip 地址的主机上（测试时可以利用同一台主机，实验室的机器大部分处于同一个子网，实验课上可以方便地进行实际环境的多机测试）打开两个终端窗口 w3 和 w4，在 w3 运行运行 client（connector），按提示输入 server 的 ip4 地址和端口号，连接成功后 client 的默认名字是 Anonymous，这时处于单接收状态，按提示输入 #2 nickname 修改名字后才能输入其它命令（名字有唯一合法性判定）。如前所述在 w4 运行 pad 建立和 connector 的连接，进入等待输入状态，在 pad 上输入 --help 可以得到命令提示。
>
> 如此可以建立多个 connector，server 可接收的数量在 .h 中的 MAX_CONN_NUM 定义，重新编译 server 后生效。申请接入的数量超过这个上限时，server 因为申请不到资源而暂停监听，大家可以讨论更加适当的处理方法。
>
> 

- #### **data_center()和socket_trans()中使用到的匿名管道数据流示意图：**

![image-20220426180041411](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204261800196.png)

**图示说明：**

左半部分为data_center()函数中的管道读写情况，右半部分是socket_trans()函数中的管道读写情况；



- #### **总体功能结构图**：

![image-20220427143406345](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271434681.png)

##### BBS程序总体说明：

在server端应用到了如下的匿名管道：

| 管道             | 阻塞或非阻塞 | 功能                                  |
| ---------------- | ------------ | ------------------------------------- |
| pipe_newsn       | O_NONBLOCK   | 传输新client信息                      |
| pipe_req_nullsn  | O_NONBLOCK   | 创建sn空信息                          |
| pipe_resp_nullsn | O_BLOCK      | 记录sn空信息                          |
| pipe_updatesn    | O_NONBLOCK   | 传输新client信息                      |
| pipe_s2d         | O_NONBLOCK   | 从socket_trans()->data_center()传输   |
| pipe_d2s         | O_NONBLOCK   | 从data_center()->从socket_trans()传输 |

在该BBS程序中，有三大主要板块：Server、Client和Pad，其中一个Server可以连接指定数目的Client，Server和Client通过在Pad进程中输入信息进行通信，连接Pad需要由Server和Client生成的唯一的Pad code来进行连接，Pad与Server和Client之间通过命名管道进行通信，传输信息，而Server和Client之间则通过Socket进行通信；在Server端中定义了几个函数用来处理Client端发送过来的信息，这些函数的说明将在后面的分析中详细展开；



- #### 程序流程图

**Server端程序流程图：**

![image-20220427134148670](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271426617.png)

**流程图说明：**

在server端，首先函数init_stat_des()对状态表进行初始化，然后执行函数init_input_pad()初始化Pad中使用到的FIFO命名管道，之后执行函数init_pipe()，对所有server端中使用到的匿名管道进行初始化，并且设置管道为non-blocking或者blocking，之后执行函数init_socket()，创建与client端进行通信的socket；

初始化工作完成之后，进行fork()操作，一共进行三次，每次fork出来的子进程需要负责执行一个函数；





**Client端程序流程图：**

![image-20220427134204270](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271342426.png)

**流程图说明：**

在client端，首先函数init_socket()，创建于server端进行通信的socket，然后执行函数init_input_pad()初始化Pad中使用到的FIFO命名管道；

初始化工作完成之后，需要进行一次fork，父子进程分别对server进行send()和recv()操作，由于信息是在pad中写入，所以在发送之前需要从pipe_padr命名管道中读取信息，进而发送；

​	

##### 补充：

这里需要补充的是在本程序中采用的**心跳包（Heartbeat packet）**机制，程序中定义为heart_beating()函数：

**心跳包**是在客户端和服务端之间定时通知对方自己状态的一个自己定义的命令字，按照一定的时间间隔发送，类似于心跳所以叫做心跳包。

所谓的心跳包就是客户端定时发送简单的信息给服务器端告诉它我还在而已。代码就是每隔几分钟发送一个固定信息给服务端，服务端收到后回复一个固定信息。如果服务端几分钟内没有收到客户端信息则视为客户端断开。





**接下来，对例程代码进行详细的分析与说明（包括代码实现的进程并发行为和代码实现的 IPC 行为）：**

##### 例程代码：

> alg.11-0-BBS-8.h

```c
#include <netinet/in.h>

#define MAX_QUE_CONN_NM 5 /* length of ESTABLISHED queue */
#define MAX_CONN_NUM 5 /* cumulative number of connecting processes */
// #define MAX_CONN_NUM 10 /* cumulative number of connecting processes */
#define CODE_LEN 5  /* 4 digits for input-pad code */

#define ERR_EXIT(m) \
    do { \
        perror(m); \
        exit(EXIT_FAILURE); \
    } while(0)

#define ERR_RETURN(m) \
    do { \
        perror(m); \
        return EXIT_FAILURE; \
    } while(0)

#define SN_SIZE 4
#define UID_SIZE 4
#define NICKNAME_LEN 11 /* 10 chars for nickname */
#define SEND_SIZE 512
#define MSG_SIZE SEND_SIZE - SN_SIZE - UID_SIZE - NICKNAME_LEN

struct {
    int uid;
    int pre_stat;
    int stat;
    char nickname[NICKNAME_LEN];
    char ip4_addr[INET_ADDRSTRLEN];
	int port_num;
} sn_attri[MAX_CONN_NUM]; /* global, initiated by 0s */ 

struct {
    int src_sn;
    int uid;
    char nickname[NICKNAME_LEN];
    char msg_buf[MSG_SIZE];
} send_buf; 
void* send_buf_ptr; /* send_buf_ptr = (void* )&send_ptr */
char msg_buf[MSG_SIZE];

#define STAT_SIZE 16+INET_ADDRSTRLEN
struct {
    int sn;
		int uid;
    int stat;
    char ip4_addr[INET_ADDRSTRLEN];
	int port_num;
} stat_buf;
void* stat_buf_ptr;

```

**代码说明与分析：**

这部分代码定义了在BBS通信中使用到的数据结构，其中包括：

sn_attri：

send_buf：发送的消息的buffer类型

stat_buf：状态buffer

并且设定了MAX_QUE_CONN_NM为5，队列的最大长度为5

MAX_CONN_NUM，可以连接的client端最大数量，这里为5；

CODE_LEN为5，定义了pad code的长度为4；



## 1. PAD

> alg.11-3-socket-input-pad-8-1.c

```c

    /* input-pad, create an FIFO with a BBS terminal */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/signal.h>

#include "alg.11-0-BBS-8.h"

int pipe_hbr, pipe_padw; /* FIFO */
int pipe_brdc; /* broadcasting pad-code */

    /* get a string of length n-1 from stdin, save in stdin_buf and clear the stdin */ 
char* s_gets(char* stdin_buf, int n)
{
    char* ret_val;
    int i = 0;

    ret_val = fgets(stdin_buf, n, stdin);
    if(ret_val) {
        while(stdin_buf[i] != '\n' && stdin_buf[i] != '\0') {
            i++;
        }
        if(stdin_buf[i] == '\n') {
            stdin_buf[i] = '\0';
        } else {
            while (getchar() != '\n') ;
        }
    }

    return ret_val;
}

void heart_beating(int sec)
{
	char bufstr[1];
	int ret, i = 1;
	while (1) {
		ret = read(pipe_hbr, bufstr, 1);
		if(ret <= 0) { /* write-end missed */
			printf("Heart beating write-end missed, terminated ... \n");
			break;
		}
	}
	
	return;
}

    /* read code from pipe_brdc and create an FIFO */
int init_FIFO(int a_m) /* a_m: 1 - manual fifoname, other - auto fifoname */
{
    char code_str[CODE_LEN]; 
    char fifoname[80], fifo_hb[80], fifo_brdc[80];
    int flags, ret;

	if(a_m == 1) { /* manual connecting mode */
		printf("Enter %d-digit pad code: ", CODE_LEN); /* pad code is from some BBS terminal */
		memset(code_str, 0, CODE_LEN);
		s_gets(code_str, CODE_LEN); /* type in the CODE_LEN-digit code for input-pad */ 
		sprintf(code_str, "%d", atoi(code_str));
		strcpy(fifoname, "/tmp/input-pad.fifo-");
		strcat(fifoname, code_str);
		printf("fifoname: %s\n", fifoname);
	} else {
		strcpy(fifo_brdc, "/tmp/input-pad.fifo-brdc"); /* FIFO for pad-code broadcasting */
		if(access(fifo_brdc, F_OK) == -1) { /* if FIFO not exists */
			ERR_RETURN("\taccess()");
		} else {
			printf("An FIFO %s for pad code broadcasting attached\n", fifo_brdc);
		}

		pipe_brdc = open(fifo_brdc, O_RDONLY);  /* blocking read */
		if(pipe_brdc < 0) {
			ERR_RETURN("\tFIFO open()");
		}

		ret = read(pipe_brdc, code_str, CODE_LEN); /* blocking read */
		strcpy(fifoname, "/tmp/input-pad.fifo-");
		strcat(fifoname, code_str);
		printf("fifoname: %s\n", fifoname);
	}
	
    if(access(fifoname, F_OK) == -1) { /* if FIFO not exists */
        ERR_RETURN("\taccess()");
    } else {
        printf("An FIFO %s for pad connection attached\n", fifoname);
    }
        
    pipe_padw = open(fifoname, O_WRONLY); /* blocking write and blocking read in default */
    if(pipe_padw < 0) { 
        ERR_RETURN("\tFIFO open()");
    }

    strcpy(fifo_hb, fifoname);
    strcat(fifo_hb, ".hb"); /* FIFO for heart beating */
    if(access(fifo_hb, F_OK) == -1) { /* if FIFO not exists */
        ERR_RETURN("\taccess()");
    } else {
        printf("An FIFO %s for heart beating ttached\n", fifo_hb);
    }

    pipe_hbr = open(fifo_hb, O_RDONLY);  /* blocking read in default */
    if(pipe_hbr < 0) {
        close(pipe_padw);
        unlink(fifoname);
		unlink(fifo_hb);
        ERR_RETURN("\tFIFO open()");
    }

    return EXIT_SUCCESS;
}


void help_print(void)
{
    printf("\n\t\t\t==== Client Terminal Command ====\n");
    printf("\t\t#0 - sn undisturbed: STAT_ACCEPTED/STAT_ACTIVE -> STAT_UNDISTURBED\n");
    printf("\t\t#1 - sn resumed from UNDISTURBED\n");
    printf("\t\t#2 - sn renamed nickname\n");
    printf("\t\t$1 - list sn stat\n");
    printf("\t\t$2 - list all clients\n");
    printf("\t\t@nickname msg - select socketfd_cli[sn] with nickname and send mag\n");
    printf("\n\t\t\t==== Console Terminal Command ====\n");
    printf("\t\t@nickname #0 - nickname set to BANNED: STAT_ACCEPTED/STAT_ACTIVE -> STAT_BANNED\n");
    printf("\t\t@nickname #1 - nickname resumed from BANNED\n");
    printf("\t\t@nickname msg - select socketfd_cli[sn] with nickname and send msg\n");
    printf("\t\t$ - list all clients\n\n");

    return;

}


int main(void)
{
    int ret;
    pid_t htbtpid;

    printf("Enter pad mode (1 - manual, other - auto)\n");
    memset(msg_buf, 0, MSG_SIZE);
    s_gets(msg_buf, MSG_SIZE);
	
	if(msg_buf[0] == '1') {
		ret = init_FIFO(1);
		if(ret == EXIT_FAILURE) {
			return EXIT_FAILURE;
		}
	} else {
		ret = init_FIFO(2);
		if(ret == EXIT_FAILURE) {
			return EXIT_FAILURE;
		}
	}

	htbtpid = fork();
    if(htbtpid < 0) {
        close(pipe_padw);
        ERR_EXIT("fork()");
    }
	if(htbtpid == 0) { /* child pro */
		heart_beating(1);
		close(pipe_padw);
		close(pipe_hbr);
		close(pipe_brdc);
		kill(getppid(), SIGKILL);
        return EXIT_SUCCESS; /* ignoring all the next statements */
    }		
		/* parent pro */
    while (1) {
        printf("Enter some text (--help): \n");
        memset(msg_buf, 0, MSG_SIZE);
        s_gets(msg_buf, MSG_SIZE);
        
        if(strncmp(msg_buf, "--help", 6) == 0) {
            help_print();
            continue;
        }

        ret = write(pipe_padw, msg_buf, MSG_SIZE);
        if(ret <= 0) {
            printf("\tConnector terminated ...\n");
            break;
        }
        
        if(strncmp(msg_buf, "#9", 2) == 0) { /* Quit */
			kill(htbtpid, SIGKILL);
            break;
        }
    }
	
    close(pipe_padw);
    close(pipe_hbr);
    close(pipe_brdc);
    return EXIT_SUCCESS;
}

```

**代码说明与分析：**

这部分代码主要是为BBS通信的server端和client端创建一个满足FIFO的pad；

在init_FIFO函数中，通过参数a_m来决定创建的FIFO pad的方式，若a_m=1，用户需要输入的pad code来组成fifoname，格式为

``/tmp/input-pad.fifo-padcode`` ，对于a_m等于其他情况，将会查找是否有名为``/tmp/input-pad.fifo-brdc`` 的FIFO pad，如果存在，则会调用``read()``函数读取其中的内容，获得pad code，再如同前一种情况一样，将pad code作为fifoname的一部分，即``/tmp/input-pad.fifo-padcode`` 





## 2.Client

> alg.11-4-socket-connector-BBS-8-1.c

```c
    /* client end, asynchronous send-receive; connect to input-pad by FIFO */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <sys/signal.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <time.h>

#include "alg.11-0-BBS-8.h"


int pipe_padr; /* named pipes for input-pad read */
int pipe_hbw; /* named pipes for heart beating write */
int pipe_brdc; /* broadcasting pad-code */
int socket_fd;
char fifoname[80], fifo_hb[80], fifo_brdc[80];

    /* get a string of length n-1 from stdin and clear the stdin buffer */
char* s_gets(char* stdin_buf, int n)
{
     char* ret_val;
     int i = 0;

     ret_val = fgets(stdin_buf, n, stdin);
     if(ret_val) {
         while(stdin_buf[i] != '\n' && stdin_buf[i] != '\0') {
             i++;
         }
         if(stdin_buf[i] == '\n') {
             stdin_buf[i] = '\0';
         } else {
             while (getchar() != '\n') ;
         }
     }
  
     return ret_val;
}

int random_code(void)
{
	int code_len, random_code;
	long int modulus = 1;
	int i;
	
	code_len = CODE_LEN;
	for(i = 1; i < code_len; i++) {
		modulus = modulus * 10;
	}
	
	srand(time(NULL));
    while(1) {
        random_code = rand() % modulus;
        if(random_code > modulus / 10 - 1) {
            break;
        }
    }
	return random_code;
}

void heart_beating(int sec)
{
	char bufstr[1];
	int i = 1;
	while (1) {
		write(pipe_hbw, bufstr, 1);
		sleep(sec);
	}
	
	return;
}


int init_input_pad(void)
{
    int pad_code, ret;
    char code_str[CODE_LEN];

	pad_code = random_code();
    printf("Generated pad code is: %d\n", pad_code);

    sprintf(code_str, "%d", pad_code);
    strcpy(fifoname, "/tmp/input-pad.fifo-");
    strcat(fifoname, code_str);
    printf("fifoname: %s\n", fifoname);

        /* make a FIFO */
    if(access(fifoname, F_OK) == -1) { /* if FIFO not exists */
        ret = mkfifo(fifoname, 0666); /* create an FIFO, permission 0666 consistent to open flag O_RDWR */
        if(ret != 0) {
            ERR_RETURN("\tmkfifo()");
        } else {
            printf("A new FIFO %s for pad connection created\n", fifoname);
        }
    } else  {
        printf("An FIFO %s for pad connection attached\n", fifoname);
    }
        
    pipe_padr = open(fifoname, O_RDWR);  /* blocking write and blocking read in default */
    if(pipe_padr < 0) {
        unlink(fifoname);
        ERR_RETURN("\tFIFO open()");
    }

    strcpy(fifo_hb, fifoname);
    strcat(fifo_hb, ".hb"); /* FIFO for heart beating */
    if(access(fifo_hb, F_OK) == -1) { /* if FIFO not exists */
        ret = mkfifo(fifo_hb, 0666); /* create an FIFO heart beating, permission 0666 consistent to open flag O_RDWR */
        if(ret != 0) {
            ERR_RETURN("\tmkfifo()");
        } else {
            printf("A new FIFO %s for heart beating created\n", fifo_hb);
        }
    } else  {
        printf("An FIFO %s for heart beating attached\n", fifo_hb);
    }

    pipe_hbw = open(fifo_hb, O_RDWR);  /* blocking write in default */
    if(pipe_hbw < 0) {
        close(pipe_padr);
        unlink(fifoname);
		unlink(fifo_hb);
        ERR_RETURN("\tFIFO open()");
    }

    strcpy(fifo_brdc, "/tmp/input-pad.fifo-brdc"); /* FIFO for pad-code broadcasting */
    if(access(fifo_brdc, F_OK) == -1) { /* if FIFO not exists */
        ret = mkfifo(fifo_brdc, 0666); /* create an FIFO heart beating, permission 0666 consistent to open flag O_RDWR */
        if(ret != 0) {
            ERR_RETURN("\tmkfifo()");
        } else {
            printf("A new FIFO %s for pad code broadcasting created\n", fifo_brdc);
        }
    } else  {
        printf("An FIFO %s for pad code broadcasting attached\n", fifo_brdc);
    }

    pipe_brdc = open(fifo_brdc, O_RDWR);  /* blocking read and write in default */
    if(pipe_brdc < 0) {
        close(pipe_padr);
		close(pipe_hbw);
        unlink(fifoname);
		unlink(fifo_hb);
        ERR_RETURN("\tFIFO open()");
    }

	ret = write(pipe_brdc, code_str, CODE_LEN);

    return EXIT_SUCCESS;
}

    /* create a socket to the server */
int init_socket(void)
{
    char ip_addr[INET_ADDRSTRLEN]; /* length of 16 including the last '\0' */
    char port_str[6];
    uint16_t port_num;
    struct hostent *host;
    socklen_t addr_len;
    int ret;
    struct sockaddr_in server_addr, connect_addr;

    printf("Input server's hostname/ipv4: "); /* www.baidu.com or xxx.xxx.xxx.xxx */
    memset(ip_addr, 0, INET_ADDRSTRLEN);
    s_gets(ip_addr, INET_ADDRSTRLEN); 

    printf("Input server's port number: ");
    memset(port_str, 0, 6);
    s_gets(port_str, 6);
    port_num = atoi(port_str);

    host = gethostbyname(ip_addr);
    if(host == NULL) {
        printf("\tinvalid name or ip-address\n");
        return EXIT_FAILURE;
    }
    printf("server official name = %s\n", host->h_name);

    char **ptr = host->h_addr_list;
    for(; *ptr != NULL; ptr++) {
        inet_ntop(host->h_addrtype, *ptr, ip_addr, sizeof(ip_addr));
        printf("server address = %s\n", ip_addr);
    }

        /* create a connection socket */
    socket_fd = socket(AF_INET, SOCK_STREAM, 0);
    if(socket_fd  == -1) { 
        ERR_RETURN("\tsocket()");
    }
    
        /* set sockaddr_in of server-side */
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port_num);
    server_addr.sin_addr = *((struct in_addr *)host->h_addr);
    bzero(&(server_addr.sin_zero), 8);

    addr_len = sizeof(struct sockaddr);
    ret = connect(socket_fd, (struct sockaddr *)&server_addr, addr_len); /* connect to server */
    if(ret == -1) {
        close(socket_fd);
        ERR_RETURN("\tconnect()"); 
    }

        /* connect_fd is allocated a port_number after connecting */
    addr_len = sizeof(struct sockaddr);
    ret = getsockname(socket_fd, (struct sockaddr *)&connect_addr, &addr_len);
    if(ret == -1) {
        close(socket_fd);
        ERR_RETURN("\tgetsockname()");
    }
    port_num = ntohs(connect_addr.sin_port);
    strcpy(ip_addr, inet_ntoa(connect_addr.sin_addr));
    printf("local socket ip addr  = %s, port =  %hu\n", ip_addr, port_num);
    
    return EXIT_SUCCESS;
}


int main(void)
{
    int ret;
    int sendbytes, recvbytes;
    pid_t padrpid, hdbtpid;

    send_buf_ptr = (void* )&send_buf;
        
    ret = init_socket();
    if (ret == EXIT_FAILURE) {
        exit(EXIT_FAILURE);
    }
    
    ret = init_input_pad();
    if (ret == EXIT_FAILURE) {
		close(socket_fd);
        exit(EXIT_FAILURE);
    }
    
    hdbtpid = fork();
    if(hdbtpid < 0) {
        close(pipe_padr);
		close(socket_fd);
        unlink(fifoname);
		unlink(fifo_hb);
        ERR_EXIT("fork()");
    }

	if(hdbtpid == 0) { /* child pro */
		heart_beating(5); /* beating rate = 5 seconds */
        return EXIT_SUCCESS; /* ignoring all the next statements */
    }		

		/* parent pro */
    padrpid = fork();
    if(padrpid < 0) {
		close(socket_fd);
        close(pipe_padr);
		close(pipe_hbw);
        unlink(fifoname);
		unlink(fifo_hb);
		kill(hdbtpid, SIGKILL);
        ERR_EXIT("fork()");
	}
	
    if(padrpid > 0) { /* parent pro */	
		while(1) { /* receiving pipe_padr and sending connect_fd cycle */
			ret = read(pipe_padr, msg_buf, MSG_SIZE); /* blocking FIFO read from input-pad */
			if(ret <= 0) {
				perror("read()"); 
				continue;
			}
			if(strlen(msg_buf) == 0) {
				continue;
			}
// printf("input-pad: %s\n", msg_buf); /* this line is for testing */
			sendbytes = send(socket_fd, msg_buf, MSG_SIZE, 0); /* blocking socket send */
			if(sendbytes <= 0) {
				printf("\tsendbytes = %d. Connection terminated ...\n", sendbytes);
				continue;
			}
			if(strncmp(msg_buf, "#9", 2) == 0) { /* Quit */
				break;
			}  
		} 

		close(socket_fd);
        close(pipe_padr);
		close(pipe_hbw);
        unlink(fifoname);
		unlink(fifo_hb);
		kill(hdbtpid, SIGKILL);
        kill(padrpid, SIGKILL);
    }
    else { /* child pro */
        while(1) { /* receiving connect_fd cycle */
            recvbytes = recv(socket_fd, send_buf_ptr, SEND_SIZE, 0); /* blocking socket receive */
            if(recvbytes <= 0) {
                printf("\tServer terminated ...\n");
                break;
            }
            printf("%s: %s\n", send_buf.nickname, send_buf.msg_buf);
			if (send_buf.src_sn == -1 && strncmp(send_buf.msg_buf, "#9", 2) == 0) { /* forced quit */
                printf("I am terminated by Console!\n");
			    break;
            }
        }
		close(socket_fd);
    close(pipe_padr);
		close(pipe_hbw);
    unlink(fifoname);
		unlink(fifo_hb);
		kill(hdbtpid, SIGKILL);
    kill(getppid(), SIGKILL);
    }

    return EXIT_SUCCESS;
}


```

**代码说明与分析：**

这部分实现了client端的socket、pad的初始化，其中定义了几个初始化函数，说明如下：

- ``init_socket() ``函数 

首先，``init_socket()``函数用于创建client端的socket，便于和server端进行连接；

用户需要先输入server端的基于IPv4协议的IP地址和端口号，随后调用``socket()`` 创建一个IPv4和TCP协议的socket，其描述符为socket_fd，之后将server端的信息，存放在server_addr结构体中，包括协议族（IPv4：AF_INET）、端口号、IP地址；

做好准备工作后，调用``connect()`` 函数，与server端进行连接；

在连接成功之后，调用``getsockname()`` 函数，获取client端的端口号，对应的内容保存在connect_addr结构体中，在``init_socket()``函数最后，打印出client端socket的IP地址和端口号；

- ``init_input_pad()``函数

首先，调用函数``random_code()`` 生成一个pad code，用于标识使用的pad；

随后，需要创建一个符合FIFO的pad，将该pad code与``/tmp/input-pad.fifo-`` 共同组成fifoname，格式为``/tmp/input-pad.fifo-padcode	`` ，如果该fifoname对应的FIFO pad不存在，则调用``mkfifo()``函数新建一个特殊的FIFO文件（或者称为命名管道），它通过系统调用``open()`` 来打开，返回的文件描述符保存在``pipe_padr``中，在打开方式为可读可写；

之后，将该fifoname加上后缀.hb，作为FIFO heart beating的fifoname保存在fifo_hb参数中，这个FIFO将被用于传输心跳包，同样再次调用``mkfifo()``函数，创建一个用于heart beating的FIFO，通过系统调用``open()`` 来打开，返回的文件描述符保存在`` pipe_hbw``中，打开方式为可读可写；

此外，还需要创建一个用于broadcasting的FIFO，它的fifoname为``/tmp/input-pad.fifo-brdc`` ，同样再次调用``mkfifo()``函数，通过系统调用``open()`` 来打开，返回的文件描述符保存在``fifo_brdc``中，打开方式为可读可写，最后，将pad code写入Broadcasting FIFO中，这一过程通过系统调用``write()`` 来实现。

所以，该函数总共创建了三个FIFO（或者命名管道），它们的文件描述符分别是：

``pipe_padr``、`` pipe_hbw``、``fifo_brdc``，从名字上很容易辨认出来，它们的作用分别是传输主要信息、传输心跳包、广播信息（这里广播的是pad code）



- ``fork()``创建子进程

创建完socket和pad之后，调用``fork()``生成子进程，``fork()`` 的返回值保存在hdbtpid中；

在子进程中，调用了``heart_beating()`` 函数，传入的参数为5，这里的``heart_beating()`` 函数被定义为：

```c
void heart_beating(int sec)
{
	char bufstr[1];
	int i = 1;
	while (1) {
		write(pipe_hbw, bufstr, 1);
		sleep(sec);
	}
	
	return;
}
```

这个函数是Client端的心跳包，它会将一字节的bufstr char数组作为消息，写入pipe_hbw对应的FIFO中，并且休眠参数sec所对应的秒数后，再次发送这个消息，主要目的就是告诉外界，自己还在运作中；



之后会再调用一次``fork()`` 返回值保存在padrpid中；

在父进程中，循环调用``read()`` 函数，这里读取的FIFO（或者命名管道）是之前创建的`pipe_padr`对应的FIFO，如果读到``#9``则退出当前循环，即Quit操作，在循环中包括 ``send()`` ，传入的参数为之前创建的socket的socket_fd，即client端的socket_fd，这里发送的信息为从`pipe_padr`对应的FIFO读取到的信息；

在子进程中，循环调用``recv()`` 函数，传入的参数为client端的socket_fd，接收到的信息存放在``send_buf_ptr``中，

``send_buf_ptr`` 被定义为``send_buf_ptr = (void* )&send_buf`` ，这里的``send_buf``被定义在``alg.11-0-BBS-8.h`` 文件中，如下：

```c
struct {
    int src_sn;
    int uid;
    char nickname[NICKNAME_LEN];  //client的nickname
    char msg_buf[MSG_SIZE];  //所传输的信息的buffer
} send_buf;
```

同时打印出nickname和msg_buf的信息；

如果msg_buf中的值为\#9，表示强制退出，这里的强制退出是由Console来控制的；



## 3.Server

> alg.11-5-socket-server-BBS-nickname-8-1.c

```c
    /* one server, m clients BBS, with private chatting */
	/* Server end */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <ifaddrs.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <ctype.h>
#include <sys/time.h>
#include <time.h>

#include "alg.11-0-BBS-8.h"

#define STAT_NUM 6 /* status range: 0 - STAT_NUM-1 */
#define STAT_DES_LEN 20 /* status descriptor length */
#define STAT_NULL 0
#define STAT_ACCEPTED 1
#define STAT_ACTIVE 2
#define STAT_BANNED 3
#define STAT_UNDISTURBED 4
#define STAT_RESERVED 5
char stat_des[STAT_NUM][STAT_DES_LEN];

int socketfd_svr; /* bound to server socket */
int socketfd_cli[MAX_CONN_NUM]; /* bound to client sockets */

int pipe_newsn[2];
    /* ordinary pipe: main() -> data_center()
       packet: sn_stat_buf */
int pipe_req_nullsn[2];
    /* ordinary pipe: main() -> cli_center()
       packet: sn_stat_buf */
int pipe_resp_nullsn[2];
    /* ordinary pipe: cli_center() -> main()
       packet: sn_stat_buf */
int pipe_updatesn[2];
    /* ordinary pipe: data_center() -> cli_center()
       packet: sn_stat_buf */
	   
int pipe_s2d[2];
    /* ordinary pipe: send_buf from socket_trans() to data_center()
       packet: structure of 4(sn)10(nickname)MSG_SIZE(msg_buf) */
int pipe_d2s[MAX_CONN_NUM][2];
    /* ordinary pipe: send_buf from data_center() to socket_trans()
       packet: structure of 4(sn)10(nickname)MSG_SIZE */
	   
int pipe_padr;
    /* named pipe: msg_buf from server input-pad to data_center()
       packet: string of MSG_SIZE */
char fifoname[80];

int pipe_hbw; /* named pipes for heart beating write */
char fifo_hb[80];

int pipe_brdc; /* broadcasting pad-code */
char fifo_brdc[80];

struct sockaddr_in server_addr, connect_addr;

char server_ip_addr[INET_ADDRSTRLEN]; /* ipv4 address */
uint16_t server_port_num;

void cli_center(void);
void data_center(void);
void socket_trans(int);


void init_stat_des(void)
{
    strcpy(stat_des[STAT_NULL], "STAT_NULL");
    strcpy(stat_des[STAT_ACCEPTED], "STAT_ACCEPTED");
    strcpy(stat_des[STAT_ACTIVE], "STAT_ACTIVE");
    strcpy(stat_des[STAT_BANNED], "STAT_BANNED");
    strcpy(stat_des[STAT_UNDISTURBED], "STAT_UNDISTURBED");

    return;
}


void sleep_ms(long int timegap_ms)
{
    struct timeval t;
        /*  struct timeval {
                __time_t tv_sec;
                __suseconds_t tv_usec;
            }
        */
    long curr_s, curr_ms, end_ms;

    gettimeofday(&t, 0);
    curr_ms = (long)(t.tv_sec * 1000);
    end_ms = curr_ms + timegap_ms;
    while(1) {
        gettimeofday(&t, 0);
        curr_ms = (long)(t.tv_sec * 1000);
        if(curr_ms > end_ms) {
            break;
        }
    }
    return;
}

    /* get a string of length n-1 from stdin and clear the stdin buffer */
char* s_gets(char* stdin_buf, int n)
{    
     char* ret_val;
     int i = 0;
     
     ret_val = fgets(stdin_buf, n, stdin);
     if(ret_val) {
         while(stdin_buf[i] != '\n' && stdin_buf[i] != '\0') {
             i++;
         }
         if(stdin_buf[i] == '\n') {
             stdin_buf[i] = '\0';
         } else {
             while (getchar() != '\n') ;
         }
     }
     return ret_val;
}

	/* generate a random number with (CODE_LEN-1) digits */
int random_code(void)
{
	int code_len, random_code;
	long int modulus = 1;
	int i;
	
	code_len = CODE_LEN;
	for(i = 1; i < code_len; i++) {
		modulus = modulus * 10;
	}
	
	srand(time(NULL));
    while(1) {
        random_code = rand() % modulus;
        if(random_code > modulus / 10 - 1) {
            break;
        }
    }
	return random_code;
}

	/* not used in this programm */
void heart_beating(int sec)
{
	char bufstr[1];
	int i = 1;
	while (1) {
		write(pipe_hbw, bufstr, 1);
		sleep(sec);
	}
	
	return;
}

    /* save the ipv4 address of this server to ip_addr */
int getipv4addr(char *ip_addr)
{
    struct ifaddrs *ifaddrsptr = NULL;
    struct ifaddrs *ifa = NULL;
    void *tmpptr = NULL;
    int ret;
    
    ret = getifaddrs(&ifaddrsptr);
    if(ret == -1)
        ERR_RETURN("\tgetifaddrs()");
    
    ifa = ifaddrsptr;
    while (ifa != NULL) {
        if(ifa->ifa_addr) {
            if(ifa->ifa_addr->sa_family == AF_INET) { /* IPv4 */
                tmpptr = &((struct sockaddr_in *)ifa->ifa_addr)->sin_addr;
                char addr_buf[INET_ADDRSTRLEN];
                inet_ntop(AF_INET, tmpptr, addr_buf, INET_ADDRSTRLEN);
                printf("%s IPv4 address = %s\n", ifa->ifa_name, addr_buf);
                if(strcmp(ifa->ifa_name, "lo") != 0)
                    strcpy(ip_addr, addr_buf); /* return the ipv4 address */
            } else if(ifa->ifa_addr->sa_family == AF_INET6) { /* IPv6 */
                tmpptr = &((struct sockaddr_in6 *)ifa->ifa_addr)->sin6_addr;
                char addr_buf[INET6_ADDRSTRLEN];
                inet_ntop(AF_INET6, tmpptr, addr_buf, INET6_ADDRSTRLEN);
                printf("%s IPv6 address = %s\n", ifa->ifa_name, addr_buf);
            }
        }
        ifa = ifa->ifa_next;
    }

    if(ifaddrsptr != NULL) {
        freeifaddrs(ifaddrsptr);
    }

    return EXIT_SUCCESS;
}


int init_input_pad(void)
{   
    int pad_code, ret, flags;
    char code_str[CODE_LEN];

 	pad_code = random_code();
    printf("Generated pad code is: %d\n", pad_code);


        /* make a FIFO, connecting with an input-pad process */
    sprintf(code_str, "%d", pad_code);
    strcpy(fifoname, "/tmp/input-pad.fifo-");
    strcat(fifoname, code_str);
    printf("fifoname: %s\n", fifoname);
    if(access(fifoname, F_OK) == -1) { /* if FIFO not exists */
        ret = mkfifo(fifoname, 0666); /* create an FIFO, permission 0666 consistent to open flag O_RDWR */
        if(ret != 0) {
            ERR_EXIT("\tmkfifo()");
        } else {
            printf("A new FIFO %s for pad connection created\n", fifoname);
        }
    } else {
        printf("An FIFO %s for pad connection attached\n", fifoname);
    }

    pipe_padr = open(fifoname, O_RDWR);  /* blocking write and blocking read in default */
    if(pipe_padr < 0) {
        ERR_EXIT("\tFIFO open()");
    }
    flags = fcntl(pipe_padr, F_GETFL, 0);
    fcntl(pipe_padr, F_SETFL, flags | O_NONBLOCK); /* set to non-blocking */

        /* make a FIFO for heart beating */
    strcpy(fifo_hb, fifoname);
    strcat(fifo_hb, ".hb");
    if(access(fifo_hb, F_OK) == -1) { /* if FIFO not exists */
        ret = mkfifo(fifo_hb, 0666); /* create an FIFO heart beating, permission 0666 consistent to open flag O_RDWR */
        if(ret != 0) {
            ERR_RETURN("\tmkfifo()");
        } else {
            printf("A new FIFO %s for heart beating created\n", fifo_hb);
        }
    } else  {
        printf("An FIFO %s for heart beating attached\n", fifo_hb);
    }

    pipe_hbw = open(fifo_hb, O_RDWR);  /* blocking write in default */
    if(pipe_hbw < 0) {
        close(pipe_padr);
        unlink(fifoname);
		unlink(fifo_hb);
        ERR_RETURN("\tFIFO open()");
    }

        /* make a FIFO for pad-code broadcasting */
	strcpy(fifo_brdc, "/tmp/input-pad.fifo-brdc");
    if(access(fifo_brdc, F_OK) == -1) { /* if FIFO not exists */
        ret = mkfifo(fifo_brdc, 0666); /* create an FIFO heart beating, permission 0666 consistent to open flag O_RDWR */
        if(ret != 0) {
            ERR_RETURN("\tmkfifo()");
        } else {
            printf("A new FIFO %s for pad code broadcasting created\n", fifo_brdc);
        }
    } else  {
        printf("An FIFO %s for pad code broadcasting attached\n", fifo_brdc);
    }

    pipe_brdc = open(fifo_brdc, O_RDWR);  /* blocking read and write in default */
    if(pipe_brdc < 0) {
        close(pipe_padr);
		close(pipe_hbw);
        unlink(fifoname);
		unlink(fifo_hb);
        ERR_RETURN("\tFIFO open()");
    }

	ret = write(pipe_brdc, code_str, CODE_LEN);
   
    return EXIT_SUCCESS;
}


int init_pipe(void)
{
    int sn, ret, flags;

    ret = pipe(pipe_newsn);
    if(ret == -1) {
        ERR_EXIT("\tpipe(pipe_newsn)");
    }
    flags = fcntl(pipe_newsn[0], F_GETFL, 0);
    fcntl(pipe_newsn[0], F_SETFL, flags | O_NONBLOCK);

    ret = pipe(pipe_req_nullsn);
    if(ret == -1) {
        ERR_EXIT("\tpipe(pipe_req_nullsn)");
    }
    flags = fcntl(pipe_req_nullsn[0], F_GETFL, 0);
    fcntl(pipe_req_nullsn[0], F_SETFL, flags | O_NONBLOCK);

    ret = pipe(pipe_resp_nullsn); /* blocking read */
    if(ret == -1) {
        ERR_EXIT("\tpipe(pipe_resp_nullsn)");
    }

    ret = pipe(pipe_updatesn);
    if(ret == -1) {
        ERR_EXIT("\tpipe(pipe_updatesn)");
    }
    flags = fcntl(pipe_updatesn[0], F_GETFL, 0);
    fcntl(pipe_updatesn[0], F_SETFL, flags | O_NONBLOCK);

    ret = pipe(pipe_s2d);
    if(ret == -1) {
        ERR_EXIT("\tpipe(pipe_s2d)");
    }
    flags = fcntl(pipe_s2d[0], F_GETFL, 0);
    fcntl(pipe_s2d[0], F_SETFL, flags | O_NONBLOCK);

    for (sn = 0; sn < MAX_CONN_NUM; sn++) {
        ret = pipe(pipe_d2s[sn]);
        if(ret == -1) {
            printf("\tpipe(pipefd[%d]) error: ", sn);
            ERR_EXIT(NULL);
        }
    }
    for (sn = 0; sn < MAX_CONN_NUM; sn++) {
        flags = fcntl(pipe_d2s[sn][0], F_GETFL, 0);
        fcntl(pipe_d2s[sn][0], F_SETFL, flags | O_NONBLOCK);
        flags = fcntl(pipe_d2s[sn][1], F_GETFL, 0);
        fcntl(pipe_d2s[sn][1], F_SETFL, flags | O_NONBLOCK); /* for cyclic unblocking write */
    }

    return EXIT_SUCCESS;
}


int init_socket(void)
{
    int ret;
    struct sockaddr_in server_addr, connect_addr;
    socklen_t addr_len;

    socketfd_svr = socket(AF_INET, SOCK_STREAM, 0); /* create an ipv4 server*/
    if(socketfd_svr == -1) {
        ERR_EXIT("\tsocket()");
    }
    printf("socketfd_svr = %d\n", socketfd_svr);

    ret = getipv4addr(server_ip_addr); /* get server ipv4 address */
    if (ret == EXIT_FAILURE) {
        close(socketfd_svr);
        ERR_EXIT("\tgetifaddrs()");
    }
    printf("Server ipv4 addr: %s\n", server_ip_addr);

        /* set sockaddr_in */
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = 0; /* auto server port number */
    server_addr.sin_addr.s_addr = inet_addr(server_ip_addr);
    bzero(&(server_addr.sin_zero), 8); /* padding with 0's */

    int opt_val = 1;
    setsockopt(socketfd_svr, SOL_SOCKET, SO_REUSEADDR, &opt_val, sizeof(opt_val)); /* many options */

    addr_len = sizeof(struct sockaddr);
    ret = bind(socketfd_svr, (struct sockaddr *)&server_addr, addr_len);
    if(ret == -1) {
        close(socketfd_svr);
        ERR_EXIT("\tbind()");
    }
    printf("Bind success!\n");

    addr_len = sizeof(server_addr);
    ret = getsockname(socketfd_svr, (struct sockaddr *)&server_addr, &addr_len);
    if(ret == 0) {
        server_port_num = ntohs(server_addr.sin_port);
        printf("Server port number = %hu\n", server_port_num);
    } else {
        close(socketfd_svr);
        ERR_EXIT("\tgetsockname()");
    }

    ret = listen(socketfd_svr, MAX_QUE_CONN_NM);
    if(ret == -1) {
        close(socketfd_svr);
        ERR_EXIT("\tlisten()");
    }
    printf("Listening ...\n");
      
    return EXIT_SUCCESS;
}


int main(void)
{
    int curr_sn, sn; /* index of sn_attri[], 0 .. MAX_CONN_NUM-1 */
    int uid; /* 0 for Console */
    int stat;
    int ret;
    pid_t data_pid, cli_pid, socket_pid;
    socklen_t addr_len;
    char cli_ip_addr[INET_ADDRSTRLEN];
    uint16_t cli_port_num;

    send_buf_ptr = (void* )&send_buf;
    stat_buf_ptr = (void* )&stat_buf;

    init_stat_des();

    ret = init_input_pad();
    if (ret == EXIT_FAILURE) {
        return EXIT_FAILURE;
    }

    ret = init_pipe();
    if (ret == EXIT_FAILURE) {
        return EXIT_FAILURE;
    }

    ret = init_socket();
    if (ret == EXIT_FAILURE) {
        return EXIT_FAILURE;
    }

    for (sn = 0; sn < MAX_CONN_NUM; sn++) {
        sn_attri[sn].uid = -1;
        sn_attri[sn].stat = STAT_NULL;
        strcpy(sn_attri[sn].nickname, "Anonymous");
    }

    data_pid = fork();
    if(data_pid < 0) {
        close(socketfd_svr);
        ERR_EXIT("\tfork()");
    }
    if(data_pid == 0) { /* child pro */
        data_center();
        return EXIT_SUCCESS; /* ignoring all the next statements */
    }

    cli_pid = fork();
    if(cli_pid < 0) {
        close(socketfd_svr);
        ERR_EXIT("\tfork()");
    }
    if(cli_pid == 0) { /* child pro */
        cli_center();
        return EXIT_SUCCESS; /* ignoring all the next statements */
    }

        /* parent pro */
    uid = 0;
    while (1) {
		memset(stat_buf_ptr, 0, STAT_SIZE);
		ret = write(pipe_req_nullsn[1], stat_buf_ptr, STAT_SIZE);
		if(ret <= 0) {
			perror("\tpipe_req_nullsn write()");
		};
		ret = read(pipe_resp_nullsn[0], stat_buf_ptr, STAT_SIZE); /* blocking read */
		if(ret <= 0) {
			continue;
		}
		curr_sn = stat_buf.sn;
		addr_len = sizeof(struct sockaddr); /* addr_len should be refreshed each time accept() called */
        socketfd_cli[curr_sn] = accept(socketfd_svr, (struct sockaddr *)&connect_addr, &addr_len);
        if(socketfd_cli[curr_sn] == -1) {
            perror("\taccept()");
            continue;
        }
        cli_port_num = ntohs(connect_addr.sin_port);
        strcpy(cli_ip_addr, inet_ntoa(connect_addr.sin_addr));
        uid++;
        printf("New socket: curr_sn %d, user_id %d, fd %d, IP_addr %s, port %hu\n", curr_sn, uid, socketfd_cli[curr_sn], cli_ip_addr, cli_port_num);
        
        socket_pid = fork();
        if(socket_pid < 0) {
            printf("\tfork error, connection discarded. curr_sn %d, uid %d\n", curr_sn, uid);
            perror("\tfork()");
            continue;
        }
        if(socket_pid == 0) { /* child pro */ 
            socket_trans(curr_sn); /* run for each BBS client asychronously */
            exit(EXIT_SUCCESS); /* ignoring all the next statements */
        }

            /* parent pro */
		memset(stat_buf_ptr, 0, STAT_SIZE);
		stat_buf.sn = curr_sn;
		stat_buf.uid = uid;
		stat_buf.stat = STAT_ACCEPTED;
		strcpy(stat_buf.ip4_addr, cli_ip_addr);
		stat_buf.port_num = cli_port_num;
		ret = write(pipe_newsn[1], stat_buf_ptr, STAT_SIZE);
        if(ret <= 0) {
            perror("\tpipe_newsn write()");
        }

        memset(send_buf_ptr, 0, SEND_SIZE);
        send_buf.src_sn = -1;
        send_buf.uid = 0;
        strcpy(send_buf.nickname, "Console");
        strcpy(send_buf.msg_buf, "Initiate you nickname by command [#2 nickname] ...");
        ret = write(pipe_d2s[curr_sn][1], send_buf_ptr, SEND_SIZE);
        if(ret <= 0) {
            perror("\tpipe_d2s write()");
        }
            /* parent pro continue to request a NULL sn and accept a new client */
    }

    wait(0);

    close(socketfd_svr);
    for (int sn = 0; sn < MAX_CONN_NUM; sn++) {
        close(socketfd_cli[sn]);
    }

    close(pipe_newsn[0]);
    close(pipe_newsn[1]);
    close(pipe_updatesn[0]);
    close(pipe_updatesn[1]);
    close(pipe_req_nullsn[0]);
    close(pipe_req_nullsn[1]);
    close(pipe_resp_nullsn[0]);
    close(pipe_resp_nullsn[1]);
    close(pipe_s2d[0]);
    close(pipe_s2d[1]);
		
    for (int sn = 0; sn < MAX_CONN_NUM; sn++) {
        close(pipe_d2s[sn][0]);
        close(pipe_d2s[sn][1]);
    }

    close(pipe_padr);
    unlink(fifoname);

	/* Any others? */
    
    return EXIT_SUCCESS;
}

    /* listen to pipe_updatesn[0], read stat_buf and modify sn_attri[sn]
       listen to pipe_req_nullsn[0], pickup a null sn and write stat_buf to main() by pipe_resp_nullsn[1] */
void cli_center(void)
{
    int curr_sn = 0;
	int ret;
    
    while(1) {
        ret = read(pipe_req_nullsn[0], stat_buf_ptr, STAT_SIZE); /* read from main() */
        if(ret > 0) {
	        while (sn_attri[curr_sn].stat != STAT_NULL) {
                curr_sn = (curr_sn + 1) % MAX_CONN_NUM;
                ret = read(pipe_updatesn[0], stat_buf_ptr, STAT_SIZE); /* read from data_center() */
				if(ret > 0) {
					curr_sn = stat_buf.sn;
					sn_attri[curr_sn].uid = stat_buf.uid; 
                    sn_attri[curr_sn].stat = stat_buf.stat; /* may be STAT_NULL or not */
				}
            }

			sn_attri[curr_sn].stat = STAT_RESERVED;
			memset(stat_buf_ptr, 0, STAT_SIZE);
			stat_buf.sn = curr_sn;
			stat_buf.uid = -1; /* nonsense */
            stat_buf.stat = STAT_NULL;
			ret = write(pipe_resp_nullsn[1], stat_buf_ptr, STAT_SIZE); /* write to main() */
			if(ret <= 0) {
				perror("\tpipe_resp_nullsn write()");
			};
		} else {
            ret = read(pipe_updatesn[0], stat_buf_ptr, STAT_SIZE); /* read from data_center() */
			if(ret > 0) {
				curr_sn = stat_buf.sn;
				sn_attri[curr_sn].uid = stat_buf.uid;
                sn_attri[curr_sn].stat = stat_buf.stat; /* may be STAT_NULL or not */
			}
        }
    }
    return;
}

    /* listen to socketfd_cli[sn], receive data and write to data_center() for data analysis
       listen to pipe_d2s[sn][0], read data from data_center() or main() and send to socketfd_cli[sn] */
    /* main(), data_center() and socket_trans(0), socket_trans(1) ...  concurrently running */
void socket_trans(int sn)
{
	int flags;
    int recvbytes, sendbytes, ret;
    int stat;

    flags = fcntl(socketfd_cli[sn], F_GETFL, 0);
    fcntl(socketfd_cli[sn], F_SETFL, flags | O_NONBLOCK); /* set to non-blocking socket receive */

    while(1) {
            /* recv socketfd_cli[sn] and write to data_center() */
        recvbytes = recv(socketfd_cli[sn], msg_buf, MSG_SIZE, MSG_DONTWAIT);
		
        if(recvbytes == 0) {
            printf("\tSocket lost connection ...\n");
            memset(send_buf_ptr, 0, SEND_SIZE);
            send_buf.src_sn = sn; /* without uid and nickname */
            strcpy(send_buf.msg_buf, "#9");
            ret = write(pipe_s2d[1], send_buf_ptr, SEND_SIZE); /* msg with sn to data_center() */
            if(ret <= 0) {
                perror("\tpipe_s2d write()");
            }
            break;
        }

        if(recvbytes > 0) {
            printf("Socket receive: src_sn %d\n\tmsg: %s\n", sn, msg_buf);
            memset(send_buf_ptr, 0, SEND_SIZE);
            send_buf.src_sn = sn; /* without uid and nickname */
            strcpy(send_buf.msg_buf, msg_buf);
            ret = write(pipe_s2d[1], send_buf_ptr, SEND_SIZE); /* msg with sn to data_center() */
            if(ret <= 0) {
                perror("\tpipe_s2d write()");
            }

            if(strncmp(msg_buf, "#9", 2) == 0) { /* socketfd_cli[sn] claims quit */
                break;
            }

        }
		
            /* read pipe_d2s[sn] and send to socketfd_cli[sn] */
        ret = read(pipe_d2s[sn][0], send_buf_ptr, SEND_SIZE);
        if(ret > 0) { /* send send_buf to socketfd_cli[sn] */
            printf("\tsend_buf ready: src_sn %d, uid %d, nickname %s, dest.sn %d\n\tmsg: %s\n", send_buf.src_sn, send_buf.uid, send_buf.nickname, sn, send_buf.msg_buf);
            sendbytes = send(socketfd_cli[sn], send_buf_ptr, SEND_SIZE, 0); /* blocking socket send */
            if(sendbytes <= 0) {
                printf("send_buf send() to socket_cli[%d] fail\n", sn);
                perror(NULL);
            } else {
                printf("\tSocket sendbytes: %d\n", sendbytes);
            }
            
            if (send_buf.uid == 0 && strncmp(send_buf.msg_buf, "#9", 2) == 0) { /* from Console */
                break;
            }
        }

//        sleep_ms((long)100); /* a nice giving */

    }
    return;
}


void data_center(void)
{
    /*  read stat_buf for new client sn from main() by pipe_newsn[0], set uid, nickname, and stat to STAT_ACCEPTED
        read send_buf from socket_trans() by pipe_s2d, analysing send_buf_msg_buf:
            command #0 - sn undisturbed: STAT_ACCEPTED/STAT_ACTIVE -> STAT_UNDISTURBED
            command #1 - sn resumed from UNDISTURBED
            command #2 - sn renamed nickname, set to STAT_ACTIVE
            command $1 - list sn stat
            command $2 - list all clients
            command @nickname msg - select socketfd_cli[sn] with nickname and send msg
            normal msg_buf - broadcasting to clients of STAT_ACCEPTED/STAT_ACTIVE
        read msg_buf from input-pad by pipe_padr, analysing msg_buf:
            command @nickname #0 - nickname set to BANNED
            command @nickname #1 - nickname resumed from BANNED
            command @nickname msg - select socketfd_cli[sn] with nickname and send msg
            command $ - list all clients
            normal msg_buf - broadcasting to clients of STAT_ACCEPTED/STAT_ACTIVE
        write stat_buf for deleted sn to cli_center() by pipe_delesn[1], set stat to STAT_NULL
    */

    int src_sn, sn, uid, pre_stat;
    int flags, ret, counter;
    char tmp_nickname[MSG_SIZE], tmp_msg[MSG_SIZE];
    char pre_nickname[NICKNAME_LEN];
    
    while(1) { 
        while (1) { /* listen to main(), read a new socketfd with sn, uid and STAT_ACCEPTED from main() */
            ret = read(pipe_newsn[0], stat_buf_ptr, STAT_SIZE);
            if(ret <= 0) { /* pipe empty */
                break;
            } 
            
			sn = stat_buf.sn;
            sn_attri[sn].uid = stat_buf.uid;
			sn_attri[sn].pre_stat = sn_attri[sn].stat;
            sn_attri[sn].stat = stat_buf.stat; /* STAT_ACCEPTED */
            strcpy(sn_attri[sn].nickname, "Anonymous");
			strcpy(sn_attri[sn].ip4_addr, stat_buf.ip4_addr);
			sn_attri[sn].port_num = stat_buf.port_num;
            printf("New sn: sn %d, uid %d, stat %s -> ACCEPTED\n", sn, sn_attri[sn].uid, stat_des[sn_attri[sn].pre_stat]);
			
			ret = write(pipe_updatesn[1], stat_buf_ptr, STAT_SIZE); /* write to cli_center() */
			if(ret <= 0) {
				perror("\tpipe_updatesn write()");
		    }
        }
        
        while (1) { /* listen to socket_trans(), read send_buf and analyze */
            ret = read(pipe_s2d[0], send_buf_ptr, SEND_SIZE);
            if(ret <= 0) { /* pipe empty */
                break;
            }
            
            src_sn = send_buf.src_sn; /* source socketfd_cli[sn] */
            if(sn_attri[src_sn].stat == STAT_NULL) {
                continue;
            } 
            
            strcpy(msg_buf, send_buf.msg_buf);
            
            if (strncmp(msg_buf, "#9", 2) == 0) {
				printf("Terminating: src_sn %d, uid %d, stat %s -> STAT_NULL\n", src_sn, sn_attri[src_sn].uid, stat_des[sn_attri[src_sn].stat]);
				sn_attri[src_sn].uid = -1;
				sn_attri[src_sn].stat = STAT_NULL;
				strcpy(sn_attri[src_sn].nickname, "Anonymous");
				strcpy(sn_attri[src_sn].ip4_addr, "");
				sn_attri[src_sn].port_num = 0;
				
				memset(stat_buf_ptr, 0, STAT_SIZE);
				stat_buf.sn = src_sn;
				stat_buf.uid = -1;
				stat_buf.stat = STAT_NULL;
				ret = write(pipe_updatesn[1], stat_buf_ptr, STAT_SIZE); /* write to cli_center() */
				if(ret <= 0) {
					perror("\tpipe_updatesn write()");
				}
                continue;
            }

            if(sn_attri[src_sn].stat == STAT_BANNED) {
                memset(send_buf_ptr, 0, SEND_SIZE);
                send_buf.src_sn = -1;
                send_buf.uid = 0;
                strcpy(send_buf.nickname, "Console");
                strcpy(send_buf.msg_buf, "You are BANNED!");
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret < 0) {
                    printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                }
                continue;
            }
            
            if(sn_attri[src_sn].stat == STAT_ACCEPTED  && strncmp(send_buf.msg_buf, "#2", 2) != 0) {
                memset(send_buf_ptr, 0, SEND_SIZE);
                send_buf.src_sn = -1;
                send_buf.uid = 0;
                strcpy(send_buf.nickname, "Console");
                strcpy(send_buf.msg_buf, "Initiate you nickname by command [#2 nickname] ...");
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret < 0) {
                    printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                }
                continue;
            }
            
            if (msg_buf[0] != '$' && msg_buf[0] != '#' && msg_buf[0] != '@') { /* normal BBS message */
                send_buf.src_sn = src_sn;
                send_buf.uid = sn_attri[src_sn].uid;
                strcpy(send_buf.nickname, sn_attri[src_sn].nickname);
                for (sn = 0; sn < MAX_CONN_NUM; sn++) { /* message sent to all sn's */
                    if(sn_attri[sn].stat == STAT_ACTIVE || sn_attri[sn].stat == STAT_ACCEPTED) {
                        ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                        if(ret < 0) {
                            printf("\tdest.sn = %d pipe write error, message missed ...\n", sn);
                        }
                    }
                }
                continue;
            }
            
            if (msg_buf[0] == '@') { /* @nickname msg: direct sending */
                sscanf(&msg_buf[1], "%s %s", tmp_nickname, tmp_msg);
                if (strlen(tmp_nickname) > NICKNAME_LEN-1 || strlen(tmp_nickname) == 0 || strlen(tmp_msg) == 0) {
                    send_buf.src_sn = -1;
                    send_buf.uid = 0;
                    strcpy(send_buf.nickname, "Console");
                    strcpy(send_buf.msg_buf, "Illegal command line!");
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret < 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                    continue;
                }
                    
                send_buf.src_sn = src_sn;
                send_buf.uid = sn_attri[src_sn].uid;
                strcpy(send_buf.nickname, sn_attri[src_sn].nickname);
                strcpy(send_buf.msg_buf, tmp_msg);
                counter = 0;
                for (sn = 0; sn < MAX_CONN_NUM; sn++) { /* looking for tmp_niakname */
                    if(strcmp(sn_attri[sn].nickname, tmp_nickname) == 0) {
                        if(sn_attri[sn].stat == STAT_ACTIVE || sn_attri[sn].stat == STAT_ACCEPTED) {
                            counter++;
                            ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                            if(ret < 0) {
                                printf("\tdest.sn = %d pipe write error, message missed ...\n", sn);
                            }
                        }
                    }
                }
                send_buf.src_sn = -1;
                send_buf.uid =0;
                strcpy(send_buf.nickname, "Console");
                if (counter == 0) {
                    sprintf(send_buf.msg_buf, "No valid nickname: %s found", tmp_nickname);
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret < 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                } else {
                    sprintf(send_buf.msg_buf, "Nickname: %s - %d found and msg sent", tmp_nickname, counter);
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret < 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                }
                continue;
            }
            
            send_buf.src_sn = -1;
            send_buf.uid = 0;
            strcpy(send_buf.nickname, "Console");
            
            if(strncmp(msg_buf, "$1", 2) == 0) { /* $1: listing stat of src_cn */
                sprintf(send_buf.msg_buf, "==== uid %d: %s, %s, %s, %hu ====", sn_attri[src_sn].uid, sn_attri[src_sn].nickname, stat_des[sn_attri[src_sn].stat], sn_attri[src_sn].ip4_addr, sn_attri[src_sn].port_num);
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret <= 0) {
                    printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                } 
                continue;
            }
            
            if(strncmp(msg_buf, "$2", 2) == 0) { /* $1: listing all clients */
       		    strcpy(send_buf.msg_buf, "============================ Clients List ===============================");
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret <= 0) {
                    printf("\tsrc_sn = %d pipe write error, message missed ...\n", src_sn);
                }    
       		    strcpy(send_buf.msg_buf, "           uid    nickname             stat            IP         port");
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret <= 0) {
                    printf("\tsrc_sn = %d pipe write error, message missed ...\n", src_sn);
                }    
       		    strcpy(send_buf.msg_buf, "-------------------------------------------------------------------------");
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret <= 0) {
                    printf("\tsrc_sn = %d pipe write error, message missed ...\n", src_sn);
                }    
                for (sn = 0; sn < MAX_CONN_NUM; sn++) {
					if(sn == src_sn) {
						sprintf(send_buf.msg_buf, "        %6d  %10s %20s %15s %6d", sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat], sn_attri[sn].ip4_addr, sn_attri[sn].port_num);
					} else {
						sprintf(send_buf.msg_buf, "        %6d  %10s %20s", sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat]);
					}
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret <= 0) {
                        printf("\tsrc_sn = %d pipe write error, message missed ...\n", src_sn);
                        break;
                    }    
                }
     		    strcpy(send_buf.msg_buf, "===========================================================================");
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret <= 0) {
                    printf("\tsrc_sn = %d pipe write error, message missed ...\n", src_sn);
                }
                sprintf(send_buf.msg_buf, "Server ip: %s,  port: %hu\n", server_ip_addr, server_port_num);
                ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                if(ret <= 0) {
                    printf("\tsrc_sn = %d pipe write error, message missed ...\n", src_sn);
                }

                continue;
            }
            
            if (strncmp(msg_buf, "#0", 2) == 0) { /* #0: set UNDISTURBED stat */
                if(sn_attri[src_sn].stat == STAT_ACTIVE || sn_attri[src_sn].stat == STAT_ACCEPTED) {
                    sn_attri[src_sn].pre_stat = sn_attri[src_sn].stat;
                    sn_attri[src_sn].stat = STAT_UNDISTURBED;
                    sprintf(send_buf.msg_buf, "You are set to UNDISTURBED!");
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret <= 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                    continue;
                } else {
                    sprintf(send_buf.msg_buf, "You cannot change your stat!");
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret <= 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                    continue;
                }
            }
                
            if (strncmp(msg_buf, "#1", 2) == 0) { /* #1: resume from UNDISTURBED */
                if(sn_attri[src_sn].stat == STAT_UNDISTURBED) {
                    sn_attri[src_sn].stat = sn_attri[src_sn].pre_stat;;
                    sprintf(send_buf.msg_buf, "You are resumed to %s!", stat_des[sn_attri[src_sn].stat]);
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret <= 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                    continue;
                } else {
                    sprintf(send_buf.msg_buf, "You cannot change your stat!");
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret <= 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                    continue;
                }
            }
            
            if(strncmp(msg_buf, "#2", 2) == 0) { /* #2: rename nickname */
                sscanf(msg_buf, "%s %s", tmp_msg, tmp_nickname);
                if (strlen(tmp_msg) > 2 || strlen(tmp_nickname) > NICKNAME_LEN-1 || strlen(tmp_nickname) == 0) {
                    strcpy(send_buf.msg_buf, "Illegal command line!");
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret < 0) {
                        printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                    }
                    continue;
                }
                    
                ret = strcmp("Anonymous", tmp_nickname) * strcmp("Console", tmp_nickname);
                if(ret == 0) {
                    sprintf(send_buf.msg_buf, "Illegal nickname: %s", tmp_nickname);
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret <= 0) {
                        printf("\tpipe_d2s[%d] pipe write error, message missed ...\n", src_sn);
                    }    
                    continue;
                }
                for (sn = 0; sn < MAX_CONN_NUM; sn++) {
                    ret = strcmp(sn_attri[sn].nickname, tmp_nickname); 
                	if(ret == 0) {
                        sprintf(send_buf.msg_buf, "This nickname occupied: %s", tmp_nickname);
                        ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                        if(ret <= 0) {
                            printf("\tsn = %d pipe write error, message missed ...\n", src_sn);
                        }    
                        continue;
                    }
                }
                if(sn >= MAX_CONN_NUM) { /* tmp_nickname not duplicated */
                    strcpy(pre_nickname, sn_attri[src_sn].nickname);
                    strcpy(sn_attri[src_sn].nickname, tmp_nickname);
                    printf("Nickname changing: uid %d, nickname %s -> %s\n", sn_attri[src_sn].uid, pre_nickname, sn_attri[src_sn].nickname);
                    sprintf(send_buf.msg_buf, "your nickname changed: %s -> %s", pre_nickname, sn_attri[src_sn].nickname);
                    ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                    if(ret <= 0) {
                        printf("\tsn = %d write error, message missed ...\n", src_sn);
                        continue;
                    }    
                    
                    if(sn_attri[src_sn].stat == STAT_ACCEPTED) {
                        sn_attri[src_sn].stat = STAT_ACTIVE;
                        printf("STAT changing: uid %d, stat: STAT_ACCEPTED -> STAT_ACTIVE\n", sn_attri[src_sn].uid);
                        strcpy(send_buf.msg_buf, "You are set to ACTIVE!");
                        ret = write(pipe_d2s[src_sn][1], send_buf_ptr, SEND_SIZE);
                        if(ret <= 0) {
                            printf("\tdest.sn = %d pipe write error, message missed ...\n", src_sn);
                        }
                    }

                    sprintf(send_buf.msg_buf, "Nickname changing: uid %d, nickname %s -> %s", sn_attri[src_sn].uid, pre_nickname, sn_attri[src_sn].nickname);
                    for (sn = 0; sn < MAX_CONN_NUM; sn++) { /* message sent to all sn's */
                        if(sn_attri[sn].stat == STAT_ACTIVE || sn_attri[sn].stat == STAT_ACCEPTED) {
                            ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                            if(ret <= 0) {
                                printf("\tsn = %d pipe write error, message missed ...\n", sn);
                            }
                        }
                    }
                } 
            }
        }
        
        while (1) { /* listen to pipe_padr, read msg_buf from input-pad and analyze */
            ret = read(pipe_padr, msg_buf, MSG_SIZE);
            if(ret <= 0) {
                break;
            }
                    
//printf("input-pad: %s\n", msg_buf); /* for testing */

            send_buf.src_sn = -1;
            send_buf.uid = 0;
            strcpy(send_buf.nickname, "Console"); /* source msg from Console */
            
            if (msg_buf[0] != '@' && msg_buf[0] != '$') { /* normal BBS message */
                strcpy(send_buf.msg_buf, msg_buf);
                for (sn = 0; sn < MAX_CONN_NUM; sn++) { /* message sent to all sn's */
                    if(sn_attri[sn].stat == STAT_ACTIVE || sn_attri[sn].stat == STAT_ACCEPTED) {
                        ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                        if(ret < 0) {
                            printf("\tdest.sn = %d pipe write error, message missed ...\n", sn);
                        }
                    }
                }
                continue;
            }
            
            if(msg_buf[0] == '$') { /* $: listing all sockedfd_cli's */
              printf("\n============================ Clients List ===============================\n");
                printf("    sn     uid    nickname             stat            IP         port\n");
                printf("-------------------------------------------------------------------------\n");
                for (sn = 0; sn < MAX_CONN_NUM; sn++) {
                    printf("%6d  %6d  %10s %20s %15s %6d\n", sn, sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat], sn_attri[sn].ip4_addr, sn_attri[sn].port_num);
                }
                printf("=========================================================================\n");
                printf("Server ip: %s,  port: %hu\n\n", server_ip_addr, server_port_num);
                continue;
            }

                /* @... ... */
            sscanf(&msg_buf[1], "%s %s", tmp_nickname, tmp_msg);
            if (strlen(tmp_nickname) > NICKNAME_LEN || strlen(tmp_nickname) == 0 || strlen(tmp_msg) == 0) {
                printf("\tIllegal command line!");
                continue;
            }
            
                /* @nickname ... */
            int counter = 0; 
            for (sn = 0; sn < MAX_CONN_NUM; sn++) { /* looking for tmp_niakname */
                if(strcmp(sn_attri[sn].nickname, tmp_nickname) == 0) {
                    counter++;

                    if (strncmp(tmp_msg, "#9", 2) == 0) { /* @nickname #9msg */
                        printf("Terminating: uid %d, nickname %s, stat: %s -> STAT_NULL\n", sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat]);
						sn_attri[sn].uid = -1;
                        sn_attri[sn].stat = STAT_NULL;
						strcpy(sn_attri[sn].nickname, "Anonymous");
						strcpy(sn_attri[sn].ip4_addr, "");
						sn_attri[sn].port_num = 0;

                        memset(stat_buf_ptr, 0, STAT_SIZE);
						stat_buf.sn = sn;
						stat_buf.uid = -1;
						stat_buf.stat = STAT_NULL;
						ret = write(pipe_updatesn[1], stat_buf_ptr, STAT_SIZE); /* write to cli_center() */
						if(ret <= 0) {
							perror("\tpipe_updatesn write()");
						}

                        strcpy(send_buf.msg_buf, tmp_msg);
                        ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                        if(ret <= 0) {
                            perror("\tpipe_d2s write()");
                        }
						
                        continue;
                    }

                    if(strncmp(tmp_msg, "#0", 2) == 0) { /* @nickname #0 */
                        if(sn_attri[sn].stat == STAT_ACTIVE || sn_attri[sn].stat == STAT_ACCEPTED || sn_attri[sn].stat == STAT_UNDISTURBED) {
                            printf("Banning: uid %d, nickname %s, stat: %s -> STAT_BANNED\n", sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat]);
                            sn_attri[sn].pre_stat = sn_attri[sn].stat;
                            sn_attri[sn].stat = STAT_BANNED;
                            sprintf(send_buf.msg_buf, "You are BANNED!");
                            ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                            if(ret <= 0) {
                                printf("\tdest.sn = %d write error, message missed ...\n", sn);
                            }
                            continue;
                        } else {
                            printf("\tuid %d, nickname %s stat unchanged: %s\n", sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat]);
                            continue;
                        }
                    }
                    
                    if(strncmp(tmp_msg, "#1", 2) == 0) { /* @nickname #1 */
                        if(sn_attri[sn].stat == STAT_BANNED) {
                            printf("Resuming: uid %d, nickname %s, stat: %s -> %s\n", sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat], stat_des[sn_attri[sn].pre_stat]);
                            sn_attri[sn].stat = sn_attri[sn].pre_stat;
                            sprintf(send_buf.msg_buf, "You are resumed to %s!", stat_des[sn_attri[sn].stat]);
                            ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                            if(ret <= 0) {
                                printf("\tdest.sn = %d pipe write error, message missed ...\n", sn);
                            }
                            continue;
                        } else {
                            printf("\tuid %d, nickname %s stat unchanged: %s\n", sn_attri[sn].uid, sn_attri[sn].nickname, stat_des[sn_attri[sn].stat]);
                            continue;
                        }
                    }
                    
                        /* @nickname msg */
                    strcpy(send_buf.msg_buf, tmp_msg);
                    if(sn_attri[sn].stat == STAT_ACTIVE || sn_attri[sn].stat == STAT_ACCEPTED) {
                        ret = write(pipe_d2s[sn][1], send_buf_ptr, SEND_SIZE);
                        if(ret <= 0) {
                            printf("\tdest.sn = %d pipe write error, message missed ...\n", sn);
                        }
                    }
                }
            }
            if (counter == 0) {
                printf("\tnickname: %s not found\n", tmp_nickname);
            } else {
                printf("\tnickname: %s - %d found and msg sent\n", tmp_nickname, counter);
            }
        }
    }
    return;
}

```

**代码说明与分析：**

这部分是Server端的实现代码，代码比较长，需要逐部分进行分析，按照各个函数实现的功能模块来进行分析：



- ``init_stat_des()`` 函数

从main函数开始分析，可以看到最先调用的函数是``init_stat_des()``，它的定义如下：

```c
//char stat_des[STAT_NUM][STAT_DES_LEN]; （stat_des的定义）
void init_stat_des(void)
{
    strcpy(stat_des[STAT_NULL], "STAT_NULL");
    strcpy(stat_des[STAT_ACCEPTED], "STAT_ACCEPTED");
    strcpy(stat_des[STAT_ACTIVE], "STAT_ACTIVE");
    strcpy(stat_des[STAT_BANNED], "STAT_BANNED");
    strcpy(stat_des[STAT_UNDISTURBED], "STAT_UNDISTURBED");

    return;
}
```

它将一些状态符保存在了stat_des中；

随后调用的是``init_input_pad()`` 函数，这个于client端的函数一样，都是创建三个FIFO，所以就不再次展开说明了；



- ``init_pipe()`` 函数

之后调用``init_pipe()`` 函数，它的作用是初始化pipe（匿名管道）：

在代码的起始部分，可以看到定义了六个文件描述符数组，用来创建匿名管道：

```c
int pipe_newsn[2];
    /* ordinary pipe: main() -> data_center()
       packet: sn_stat_buf */
int pipe_req_nullsn[2];
    /* ordinary pipe: main() -> cli_center()
       packet: sn_stat_buf */
int pipe_resp_nullsn[2];
    /* ordinary pipe: cli_center() -> main()
       packet: sn_stat_buf */
int pipe_updatesn[2];
    /* ordinary pipe: data_center() -> cli_center()
       packet: sn_stat_buf */
	  
int pipe_s2d[2];
    /* ordinary pipe: send_buf from socket_trans() to data_center()
       packet: structure of 4(sn)10(nickname)MSG_SIZE(msg_buf) */
int pipe_d2s[MAX_CONN_NUM][2];
    /* ordinary pipe: send_buf from data_center() to socket_trans()
       packet: structure of 4(sn)10(nickname)MSG_SIZE */
```

这些描述符数组作为``pipe()`` 函数的参数来创建pipe，这里稍微复习一下pipe函数：

> ``int pipe(int fd[2])`` ，用于创建匿名管道，fd为文件描述符数组，fd[0]固定为管道的读端，fd[1]固定为管道的写端，管道的读写用最基本的read()/write()系统调用来实现，默认是阻塞式的读和写；在父进程fork出子进程之后，使用管道的两方分别关闭fd[0]和fd[1]，就可以操作管道了；

以其中一个为例：

```c
 int sn, ret, flags;

 ret = pipe(pipe_newsn);
 if(ret == -1) {
    ERR_EXIT("\tpipe(pipe_newsn)");
 }
 flags = fcntl(pipe_newsn[0], F_GETFL, 0);
 fcntl(pipe_newsn[0], F_SETFL, flags | O_NONBLOCK);
```

 这里将文件描述符数组pipe_newsn作为参数，创建了一个匿名管道，之后调用函数``fcntl()`` ， 这里也复习一下fcntl函数：

> ``int fcntl(int fd, int cmd, ...)`` 其中,`fd`是文件描述符，``cmd``表示执行何种操作
>
> 参数cmd包括：
>
> <img src="https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204251858253.png" alt="fcntl" style="zoom:50%;" />

在这个例子中，我们采用的fd为``pipe_newsn[0]`` 是读标志位，cmd参数为``F_GETFL`` 用来获取fd的状态标志，并保存在flags中；

之后再次调用``fcntl()`` 函数，这次cmd参数为``F_SETFL`` ，用来设置fd的状态标志，需要用到第三个参数，这里用的是``flags | O_NONBLOCK``，这表示的是在原来的fd状态上再加上非阻塞式的读操作，如果没有设置为NONBLOCK的读/写的话，默认是BLOCKING的；



- ``init_socket()`` 函数：

在client端中也定义了这样的函数，不过它初始化的是client端的socket，在这里所初始化的是用于Server端的socket，在实现上有些许不同；

首先调用``socket()`` 函数，创建一个基于IPv4协议的socket，socket_fd保存在socketfd_svr中；

之后调用``getipv4addr()`` 函数，用来获取本机的IPv4地址，用作Server端的地址，随后将协议族（IPv4）、端口号、IP地址都保存在struct sockaddr_in类型的 server_addr中，再调用``bind()`` 函数将它们与socketfd_svr对应的socket绑定起来；

``getsockname()`` 用于获取server端的端口号，并将其打印出来，以便client端进行连接；

随后调用``listen()`` 进入监听状态，设置等待队列中的最大数目为MAX_QUE_CONN_NM（值为5），等待Client端的连接；



接下来是对sn_attri结构体的初始化：

```c
for (sn = 0; sn < MAX_CONN_NUM; sn++) {
   sn_attri[sn].uid = -1;
   sn_attri[sn].stat = STAT_NULL;
   strcpy(sn_attri[sn].nickname, "Anonymous");
}
```

从代码中可以看到，这里的for循环最大为MAX_CONN_NUM，这个值为5，表示能够与Server端建立连接的Client的最大数目，因此这里对每个client的uid（用户id）、stat（状态，这里置为空状态STAT_NULL）、nickname（用户昵称，这里置为Anonymous）进行初始化；

sn_attri的定义如下：

```c
struct {
    int uid;
    int pre_stat;
    int stat;
    char nickname[NICKNAME_LEN];
    char ip4_addr[INET_ADDRSTRLEN];
		int port_num;
} sn_attri[MAX_CONN_NUM]; /* global, initiated by 0s */ 
```

这个数据结构是global的，且共有MAX_CONN_NUM这么多个，在例程中是5个，分别对应5个clients；从定义可看到，它能够保存的变量有用户id，前一个状态、当前状态、昵称、IP地址和端口号；



- 在main()函数中fork()子进程，进行函数调用：

  下图是fork()后子进程的函数调用情况：

![image-20220426211836396](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204262118557.png)

父进程fork出来的三个子进程分别负责执行三个函数:data_center()，cli_center()，socket_trans()；



**以下对上图进行分析：**

在初始化工作结束之后，调用了第一次``fork()`` ，其返回值保存在data_pid中；

在子进程中，会调用``data_center()`` 函数，这个函数在代码的后半部分进行了定义；

##### · data_center()函数

该函数一开始先从管道pipe_newsn中读取信息，读取到的信息是在父进程中已经写入的，所连接到的client的信息（包括socketfd、uid、status），读取到的信息保存在stat_buf中，随后将这些信息都放入sn_attri结构体中，然后这些信息被写入管道pipe_updatesn中，这里可以视为对client信息的更新；

之后又有一个while循环，其中负责处理client端传送过来的信息，包括``--help``中提供的选项，在这之中，有两个关键的管道pipe_s2d和pipe_d2s，这两个管道主要负责data_center()函数和socket_trans()函数之间进行管道通信（兄弟进程间的管道通信），通信的package由结构体send_buf进行封装（其中包括成员src_sn，uid，nickname，msg_buf）；

在一开始，先从管道pipe_s2d读取信息，这个信息是在socket_trans()函数中写入的，信息中包含client的sn，通过在sn_attri表中查询对应sn的client的状态，如果对应的状态为STAT_NULL，则进行waiting，如果是其他状态，则继续执行，读取信息中的msg_buf成员，msg_buf包含了client端中输入的信息，可以是正常信息，也可以是``--help``中提供的选项，data_center()将会对这些进行判断并执行相应的操作；观察这些具体的操作可知，执行对应操作的过程中，需要对管道pipe_d2s进行写操作；

此外，又有另一个while循环，其中为读取管道pipe_padr中的信息，这个管道是个命名管道，当中的信息是client端在pad输入的，所以这部分是直接对pad中输入的信息进行处理；

------



在父进程中，调用了第二次``fork()`` ，其返回值保存在cli_pid中；

在它的子进程中，会调用``cli_center()`` 函数；

##### · cli_center()函数

该函数负责管理与server相连的client，对全局的sn_attri数组（当中保存的是client的信息）进行维护，在这之中涉及到的管道有pipe_req_nullsn和pipe_updatesn；

如果父进程在管道pipe_req_nullsn中已经写入，那么该子进程首先对管道pipe_updatesn进行读操作，该管道中的信息是stat_buf结构的，故可以对sn_attri数组中sn、uid、stat进行更新，其中stat会被更新成STAT_RESERVED，表示在sn_attri数组中保存了该client的信息，随后往管道pipe_resp_nullsn中写入对应的sn的state为STAT_NULL的消息（在这之前，父进程会一直等待管道pipe_resp_nullsn中的消息，直到读取到消息才继续往下执行）；

反之，如果父进程在管道pipe_req_nullsn中没有写入消息，则首先对管道pipe_updatesn进行读操作（在这之前data_center()已经往该管道中写，里面的信息是连接到server端的client信息），拿出其中的信息对sn_attri数组中sn、uid、stat进行更新；



------

父进程主要是在while循环中执行任务，这里对具体的细节进行说明，代码如下：

```c
    /* parent pro */
    uid = 0; //表示当前连接到server的client数；
    while (1) {
		memset(stat_buf_ptr, 0, STAT_SIZE);
		ret = write(pipe_req_nullsn[1], stat_buf_ptr, STAT_SIZE);
		if(ret <= 0) {
			perror("\tpipe_req_nullsn write()");
		};
		ret = read(pipe_resp_nullsn[0], stat_buf_ptr, STAT_SIZE); /* blocking read */
		if(ret <= 0) {
			continue;
		}
		curr_sn = stat_buf.sn;
		addr_len = sizeof(struct sockaddr); /* addr_len should be refreshed each time accept() called */
        socketfd_cli[curr_sn] = accept(socketfd_svr, (struct sockaddr *)&connect_addr, &addr_len);
        if(socketfd_cli[curr_sn] == -1) {
            perror("\taccept()");
            continue;
        }
        cli_port_num = ntohs(connect_addr.sin_port);
        strcpy(cli_ip_addr, inet_ntoa(connect_addr.sin_addr));
        uid++;
        printf("New socket: curr_sn %d, user_id %d, fd %d, IP_addr %s, port %hu\n", curr_sn, uid, socketfd_cli[curr_sn], cli_ip_addr, cli_port_num);
        
        socket_pid = fork();
        if(socket_pid < 0) {
            printf("\tfork error, connection discarded. curr_sn %d, uid %d\n", curr_sn, uid);
            perror("\tfork()");
            continue;
        }
        if(socket_pid == 0) { /* child pro */ 
            socket_trans(curr_sn); /* run for each BBS client asychronously */
            exit(EXIT_SUCCESS); /* ignoring all the next statements */
        }

            /* parent pro */
      memset(stat_buf_ptr, 0, STAT_SIZE);
      stat_buf.sn = curr_sn;
      stat_buf.uid = uid;
      stat_buf.stat = STAT_ACCEPTED;
      strcpy(stat_buf.ip4_addr, cli_ip_addr);
      stat_buf.port_num = cli_port_num;
      ret = write(pipe_newsn[1], stat_buf_ptr, STAT_SIZE);
        if(ret <= 0) {
            perror("\tpipe_newsn write()");
        }

        memset(send_buf_ptr, 0, SEND_SIZE);
        send_buf.src_sn = -1;
        send_buf.uid = 0;
        strcpy(send_buf.nickname, "Console");
        strcpy(send_buf.msg_buf, "Initiate you nickname by command [#2 nickname] ...");
        ret = write(pipe_d2s[curr_sn][1], send_buf_ptr, SEND_SIZE);
        if(ret <= 0) {
            perror("\tpipe_d2s write()");
        }
            /* parent pro continue to request a NULL sn and accept a new client */
    }
```

在一开始，父进程向管道pipe_req_nullsn写入信息stat_buf_ptr，它是一个全为0的数组，stat_buf_ptr的定义为：

``stat_buf_ptr = (void* )&stat_buf`` ，所以stat_buf_ptr的值是stat_buf的地址，其中，stat_buf结构体的定义如下；

```c
#define STAT_SIZE 16+INET_ADDRSTRLEN
struct {
    int sn;
		int uid;
    int stat;
    char ip4_addr[INET_ADDRSTRLEN];
		int port_num;
} stat_buf;
```

然后再从管道pipe_resp_nullsn中读取信息，保存在stat_buf_ptr中；



注意到，一开始定义了``int socketfd_cli[MAX_CONN_NUM]`` 数组，这个数组主要是用于保存server所连接的client的socket_fd；

父进程调用``accept()``函数，接受当前正在等待连接中的client，并将client的socket_fd保存在socketfd_cli数组中：

`` socketfd_cli[curr_sn] = accept(socketfd_svr, (struct sockaddr *)&connect_addr, &addr_len)``

这里socketfd_cli的下标 curr_sn是由stat_buf中的sn成员来指定的；将连接到的client的信息保存在connect_addr中；



------

在打印出连接成功的client的curr_sn、user_id、fd、IP_addr、port的信息后，第三次调用``fork()`` ，其返回值保存在socket_pid中，

其子进程会调用``socket_trans()`` 函数，定义如下：

##### · socket_trans()函数

```c
    /* listen to socketfd_cli[sn], receive data and write to data_center() for data analysis
       listen to pipe_d2s[sn][0], read data from data_center() or main() and send to socketfd_cli[sn] */
    /* main(), data_center() and socket_trans(0), socket_trans(1) ...  concurrently running */
void socket_trans(int sn)
{
	int flags;
    int recvbytes, sendbytes, ret;
    int stat;

    flags = fcntl(socketfd_cli[sn], F_GETFL, 0);
    fcntl(socketfd_cli[sn], F_SETFL, flags | O_NONBLOCK); /* set to non-blocking socket receive */

    while(1) {
            /* recv socketfd_cli[sn] and write to data_center() */
        recvbytes = recv(socketfd_cli[sn], msg_buf, MSG_SIZE, MSG_DONTWAIT);
		
        if(recvbytes == 0) {
            printf("\tSocket lost connection ...\n");
            memset(send_buf_ptr, 0, SEND_SIZE);
            send_buf.src_sn = sn; /* without uid and nickname */
            strcpy(send_buf.msg_buf, "#9");
            ret = write(pipe_s2d[1], send_buf_ptr, SEND_SIZE); /* msg with sn to data_center() */
            if(ret <= 0) {
                perror("\tpipe_s2d write()");
            }
            break;
        }

        if(recvbytes > 0) {
            printf("Socket receive: src_sn %d\n\tmsg: %s\n", sn, msg_buf);
            memset(send_buf_ptr, 0, SEND_SIZE);
            send_buf.src_sn = sn; /* without uid and nickname */
            strcpy(send_buf.msg_buf, msg_buf);
            ret = write(pipe_s2d[1], send_buf_ptr, SEND_SIZE); /* msg with sn to data_center() */
            if(ret <= 0) {
                perror("\tpipe_s2d write()");
            }

            if(strncmp(msg_buf, "#9", 2) == 0) { /* socketfd_cli[sn] claims quit */
                break;
            }

        }
		
            /* read pipe_d2s[sn] and send to socketfd_cli[sn] */
        ret = read(pipe_d2s[sn][0], send_buf_ptr, SEND_SIZE);
        if(ret > 0) { /* send send_buf to socketfd_cli[sn] */
            printf("\tsend_buf ready: src_sn %d, uid %d, nickname %s, dest.sn %d\n\tmsg: %s\n", send_buf.src_sn, send_buf.uid, send_buf.nickname, sn, send_buf.msg_buf);
            sendbytes = send(socketfd_cli[sn], send_buf_ptr, SEND_SIZE, 0); /* blocking socket send */
            if(sendbytes <= 0) {
                printf("send_buf send() to socket_cli[%d] fail\n", sn);
                perror(NULL);
            } else {
                printf("\tSocket sendbytes: %d\n", sendbytes);
            }
            
            if (send_buf.uid == 0 && strncmp(send_buf.msg_buf, "#9", 2) == 0) { /* from Console */
                break;
            }
        }

//        sleep_ms((long)100); /* a nice giving */

    }
    return;
}
```

该函数一开始将socketfd_cli[sn]设置成O_NONBLOCK，这里的sn为函数的参数，socketfd_cli[sn]的值为连接到server端的client端的socket_fd, 之后进入while循环：

调用``recv()`` 函数接受client发送过来的信息，存放在msg_buf中，这里分为两种情况：

首先看一下send_buf的定义：

```c
struct {
    int src_sn;
    int uid;
    char nickname[NICKNAME_LEN];
    char msg_buf[MSG_SIZE];
} send_buf; 
void* send_buf_ptr; /* send_buf_ptr = (void* )&send_ptr */
```

1. recvbytes>0   (接收到正常消息)

​		在打印出消息内容之后，将消息内容和sn存放到send_buf结构体中，再调用``write()`` 将send_buf写入管道pipe_s2d中（写入时传递的参数是指向这块send_buf的指针 send_buf_ptr），这里实际上是函数socket_trans()和函数data_center()之间的数据传输过程；

2. recvbytes=0（接受到的空消息）

​		如果接收到的是空信息，那么将它处理为“Socket lost connection”， 同样是会将消息内容和sn存放到send_buf结构体中，但是消息内容被置为“#9”，表示Force Quit，再调用``write()`` 将send_buf写入管道pipe_s2d中；

​		

在函数的while循环中的后半部分，对管道pipe_d2s进行读取``  ret = read(pipe_d2s[sn][0], send_buf_ptr, SEND_SIZE)`` ，并且将读取到的信息通过``send()`` 传送给socketfd_cli[sn]对应的client端socket，





父进程则将client端的信息（curr_sn、user_id、stat、IP_addr、port）统统保存在stat_buf结构体中，之后再将这个封装好的信息写入管道pipe_newsn中，注意到这里的stat被设置为STAT_ACCEPTED，表示现在的状态是成功连接；

此后又执行：

```c
memset(send_buf_ptr, 0, SEND_SIZE);
send_buf.src_sn = -1;
send_buf.uid = 0;
strcpy(send_buf.nickname, "Console");
strcpy(send_buf.msg_buf, "Initiate you nickname by command [#2 nickname] ...");
```

将对send_buf中的成员进行赋值，之后，通过``write()``将它写入管道pipe_d2s中，事实上pipe_d2s对应的是MAX_CONN_NUM个管道，

对应到本例中为5个管道；



**以下为data_center()和socket_trans()中使用到的匿名管道数据流示意图：**

![image-20220426180041411](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204261800196.png)

**图示说明：**

左半部分为data_center()函数中的管道读写情况，右半部分是socket_trans()函数中的管道读写情况；







------

**运行结果：**

在终端T1运行server:

![image-20220425191824243](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204251918310.png)

运行后显示pad连接码、本机IPv4地址、端口号，此后进入监听状态；



在终端T2运行Pad：

![image-20220425192019117](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204251920547.png)

提示输入选项1或者其他；



输入2：

![image-20220425192245777](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204251922431.png)

自动连接到server端对应的pad code（7362）指定的pad上，这一点从fifoname: /tmp/input-pad.fifo-7362可以看出；



在pad上输入``--help`` 可以看到提示信息：

![image-20220425192426574](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204251924029.png)

其中定义了一些参数，如#0，



在终端T3中运行client，并且输入server的IP地址和端口号，进行连接：

![image-20220425202235598](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204252022892.png)



在Server端中出现提示信息：

![image-20220425202350965](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204252023272.png)



在终端T4中运行pad，手动输入client端生成的pad code 6698:

![image-20220425212933891](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204252129090.png)



在client的pad中输入#2 Mark，将client的昵称改成Mark：

![image-20220427122942376](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271229941.png)

输入之后，在左上角的Client端和左下角的Server端分别出现了提示信息，显示修改名字过程：your nickname changed: Anonymous -> Mark，状态stat: STAT_ACCEPTED -> STAT_ACTIVE；



在client端的pad中输入正常信息：Hello, I'm Mark!

![image-20220427123135462](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271231189.png)

输入之后，在左上角的Client端显示了发送的信息，左下角的Server端提示收到的信息内容；



按照流程，再增加一个client：

![image-20220427123628416](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271236562.png)

![image-20220427123730955](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271237166.png)

在server端中提示，有新的client连接，为其分配到的sn=1，uid=2；



对该client进行改名，改成Jack：

![image-20220427123915362](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271239772.png)

![image-20220427123949011](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271239204.png)

在client和server端中都提示改名信息；



根据help中的操作，在Jack的pad中输入$2，可以列出所有client的信息：

![image-20220427124214407](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271242452.png)

在Jack的client端中，显示已经server目前已经连接了两个client，并且有它们的uid、昵称、状态、IP地址和端口号信息，最后打印出了server端的IP地址和端口号；



在Jack的pad中输入$1，可以获得它当前的状态：

![image-20220427124453501](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271244925.png)

可以看到Jack的状态为STAT_ACTIVE；



现在让Server与Jack进行私聊：

在server端按照格式： @nickname msg - select socketfd_cli[sn] with nickname and send msg 发送给Jack

![image-20220427124814454](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271248950.png)



![image-20220427124854643](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271248890.png)

在Jack的client窗口出现了该消息；



再创建一个客户Mary：

![image-20220427144744144](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271447482.png)



让Jack向Mary进行私讯，发送一条消息给Mary：

![image-20220427145113443](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271451865.png)

在Mary的Client端窗口中出现了这条消息；



Jack输入#0，进入UNDISTURBED状态：

![1](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271453997.png)

Mary向Jack私发信息，但是找不到Jack这个人，因为Jack进入了UNDISTURBED状态；



Jack输入#1解除UNDISTURBED状态后，Mary再次向Jack发送信息：

![](https://lecture11-1301936037.cos.ap-guangzhou.myqcloud.com/202204271455563.png)

Jack成功接收到信息；
