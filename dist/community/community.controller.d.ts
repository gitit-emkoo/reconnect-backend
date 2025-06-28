import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { VoteDto } from './dto/vote.dto';
export declare class CommunityController {
    private readonly communityService;
    private readonly prisma;
    constructor(communityService: CommunityService, prisma: PrismaService);
    createPost(createPostDto: CreatePostDto, user: any): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        isAnonymous: boolean;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }>;
    getAllPosts(categoryId?: string, search?: string, page?: number, limit?: number): Promise<{
        posts: {
            category: {
                name: string;
                id: string;
                isPollCategory: boolean;
            };
            content: string;
            id: string;
            createdAt: Date;
            _count: {
                comments: number;
            };
            title: string;
            tags: string[];
            poll: import("@prisma/client/runtime/library").JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
    getCategories(): Promise<{
        name: string;
        id: string;
    }[]>;
    getPostById(id: string): Promise<({
        category: {
            name: string;
            id: string;
            isPollCategory: boolean;
        };
        comments: ({
            author: {
                nickname: string;
            };
        } & {
            content: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            communityPostId: string | null;
            journalId: string | null;
            parentId: string | null;
        })[];
        votes: {
            id: string;
            createdAt: Date;
            userId: string;
            option: string;
            postId: string;
        }[];
        author: {
            nickname: string;
        };
    } & {
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        isAnonymous: boolean;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }) | null>;
    createComment(postId: string, content: string, user: any): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    createReply(postId: string, parentId: string, content: string, user: any): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    updatePost(id: string, updateData: any, user: any): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        isAnonymous: boolean;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }>;
    deletePost(id: string, user: any): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        isAnonymous: boolean;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }>;
    voteOnPost(postId: string, voteDto: VoteDto, user: any): Promise<{
        message: string;
        data?: undefined;
    } | {
        message: string;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            option: string;
            postId: string;
        };
    }>;
    getPollResult(postId: string): Promise<{}>;
}
