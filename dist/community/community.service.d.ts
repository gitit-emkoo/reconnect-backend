import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';
export declare class CommunityService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(createPostDto: CreatePostDto, authorId: string): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: Prisma.JsonValue | null;
        viewCount: number;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }>;
    getAllPosts(categoryId?: string, page?: number, limit?: number): Promise<{
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
            poll: Prisma.JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
    findAll(categoryId?: string, search?: string, page?: number, limit?: number): Promise<{
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
            poll: Prisma.JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
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
        poll: Prisma.JsonValue | null;
        viewCount: number;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }) | null>;
    createComment(postId: string, content: string, authorId: string): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    createReply(postId: string, parentId: string, content: string, authorId: string): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    updatePost(postId: string, updateData: any, userId: string): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: Prisma.JsonValue | null;
        viewCount: number;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }>;
    deletePost(postId: string, userId: string): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: Prisma.JsonValue | null;
        viewCount: number;
        agreeVotes: number;
        disagreeVotes: number;
        authorId: string;
    }>;
    voteOnPost(postId: string, userId: string, choice: number): Promise<void>;
    getPollResult(postId: string): Promise<Record<string, number>>;
}
