package main

func filter[T any](in []T, test func(T) bool) (out []T) {
	for _, item := range in {
		if test(item) {
			out = append(out, item)
		}
	}
	return
}
