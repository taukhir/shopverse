package io.shopverse.labs;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.util.Iterator;

public final class SelectorEchoLab {
    public static void main(String[] args) throws IOException {
        try (Selector selector = Selector.open(); ServerSocketChannel server = ServerSocketChannel.open()) {
            server.configureBlocking(false); server.bind(new InetSocketAddress("127.0.0.1", 0));
            server.register(selector, SelectionKey.OP_ACCEPT);
            System.out.println("echo server=" + server.getLocalAddress() + " (Ctrl+C to stop)");
            while (!Thread.currentThread().isInterrupted()) {
                selector.select(1_000);
                Iterator<SelectionKey> keys = selector.selectedKeys().iterator();
                while (keys.hasNext()) { SelectionKey key = keys.next(); keys.remove();
                    try { if (key.isAcceptable()) accept(selector, (ServerSocketChannel) key.channel());
                        else if (key.isReadable()) read(key); }
                    catch (IOException e) { key.cancel(); key.channel().close(); }
                }
            }
        }
    }
    private static void accept(Selector selector, ServerSocketChannel server) throws IOException {
        SocketChannel client = server.accept(); if (client == null) return;
        client.configureBlocking(false); client.register(selector, SelectionKey.OP_READ, ByteBuffer.allocate(4096));
    }
    private static void read(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel(); ByteBuffer buffer = (ByteBuffer) key.attachment();
        int read = channel.read(buffer); if (read < 0) { key.cancel(); channel.close(); return; }
        buffer.flip(); while (buffer.hasRemaining()) channel.write(buffer); buffer.compact();
    }
}
