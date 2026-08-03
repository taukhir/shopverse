package io.shopverse.labs;

public final class CoreLanguageScenarios {
    public static String choose(long value) { return "long"; }
    public static String choose(Integer value) { return "Integer"; }
    public static String choose(int... value) { return "varargs"; }

    public static class Parent { public static String hidden() { return "parent"; } public String override() { return "parent"; } }
    public static class Child extends Parent { public static String hidden() { return "child"; } @Override public String override() { return "child"; } }

    private CoreLanguageScenarios() { }
}
